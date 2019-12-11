import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  EditorState,
  CompositeDecorator,
  getDefaultKeyBinding
} from 'draft-js';

import {
  findWithRegex,
  getSuggestions,
  addEntityToEditorState,
  getMatch,
  getAutocomplete,
  getSelectionPosition,
  isCurrentTextEmpty,
  isCurrentSelectionAnEntity
} from './utils';

class Autocomplete extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
    onChange: PropTypes.func.isRequired,
    autocompletes: PropTypes.array,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onDownArrow: PropTypes.func,
    onUpArrow: PropTypes.func,
    onEscape: PropTypes.func,
    onTab: PropTypes.func,
    keyBindingFn: PropTypes.func,
    handleKeyCommand: PropTypes.func
  };

  static defaultProps = {
    autocompletes: []
  };

  constructor(props) {
    super(props);

    this.state = {
      focus: false, // Boolean to know if editor has focus or not
      matches: {}, // All matches found per content block and per autocomplete type
      match: null, // Current match
      selectedSuggestion: 0
    };

    this.getDecorator = this.getDecorator.bind(this);
    this.createEntityStrategy = this.createEntityStrategy.bind(this);
    this.createAutocompleteStrategy = this.createAutocompleteStrategy.bind(this);
    this.updateMatch = this.updateMatch.bind(this);
    this.resetMatch = this.resetMatch.bind(this);
    this.getChildren = this.getChildren.bind(this);
    this.buildSuggestionsList = this.buildSuggestionsList.bind(this);
    this.onSuggestionClick = this.onSuggestionClick.bind(this);
    this.addEntityWithSelectedSuggestion = this.addEntityWithSelectedSuggestion.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onDownArrow = this.onDownArrow.bind(this);
    this.onUpArrow = this.onUpArrow.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.onTab = this.onTab.bind(this);
    this.keyBindingFn= this.keyBindingFn.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
  }

  componentDidMount() {
    // When component mounted, we update editorState with our decorator
    const { editorState, onChange } = this.props;
    const decorator = this.getDecorator();
    const newEditorState = EditorState.set(editorState, { decorator });
    // Call onChange to
    onChange(newEditorState);
  }

  componentDidUpdate(prevProps) {
    // Update match state if editorState change
    // TODO: check for optimization
    if (prevProps.editorState !== this.props.editorState) {
      this.updateMatch();
    }
  }

  /**
   * Build decoration depending on autocompletes props
   *
   * @returns {CompositeDraftDecorator}
   */
  getDecorator() {
    const { autocompletes, editorState } = this.props;
    const existingDecorators = editorState.getDecorator();

    const strategies = autocompletes.reduce((previous, autocomplete) => {
      const entityStrategy = {
        strategy: this.createEntityStrategy(autocomplete.type),
        component: autocomplete.component
      };
      const autocompleteStrategy = {
        strategy: this.createAutocompleteStrategy(autocomplete),
        component: ({ children }) => (
          <span>{children}</span>
        )
      };
      previous.push(entityStrategy, autocompleteStrategy);
      return previous;
    }, existingDecorators ? existingDecorators._decorators : []);

    return new CompositeDecorator(strategies);
  }

  /**
   * Create strategy function when entity found
   *
   * @param type
   * @returns {Function}
   */
  createEntityStrategy(type) {
    return (contentBlock, callback, contentState) => {
      // Set entity for existing ones
      contentBlock.findEntityRanges(
        (character) => {
          const entityKey = character.getEntity();
          if (entityKey === null) {
            return false;
          }
          // Return true if type are matching
          return contentState.getEntity(entityKey).getType() === type;
        },
        callback
      );
    }
  }

  /**
   * Create a strategy to isolate text when matching one of autocomplete prop regex
   *
   * @param autocomplete
   * @returns {Function}
   */
  createAutocompleteStrategy(autocomplete) {
    return (contentBlock, callback) => {
      const reg = new RegExp(String.raw({
        raw: `(${autocomplete.prefix})(\\S*)(\\s|$)` // eslint-disable-line no-useless-escape
      }), 'g');
      const result = findWithRegex(reg, contentBlock, callback);
      const { matches } = this.state;
      // Create autocompletes object if doesn't exists
      if (!matches[ contentBlock.getKey() ]) {
        matches[ contentBlock.getKey() ] = {};
      }
      // We override all matches for this block and this type
      matches[ contentBlock.getKey() ][ autocomplete.type ] = result;
      // Update matches state
      this.setState({
        matches
      })
    }
  }

  /**
   * Update suggestions
   *
   * @returns {Promise<void>}
   */
  async updateMatch() {
    const { matches, focus } = this.state;
    const { editorState, autocompletes } = this.props;

    // Reset if text is empty
    if (isCurrentTextEmpty(editorState)) return this.resetMatch();

    // Reset if selection is an entity
    if (isCurrentSelectionAnEntity(editorState)) return this.resetMatch();

    // Reset if no match found
    const match = getMatch(editorState, matches);
    if (!match) return this.resetMatch();

    // Reset if no autocomplete config found for this match
    const autocomplete = getAutocomplete(autocompletes, match);
    if (!autocomplete) return this.resetMatch();

    // Get suggestions from autocomplete onMatch property
    const suggestions = await getSuggestions(autocomplete, match);

    // Update position only if focus
    let position = this.state.match && this.state.match.position ? this.state.match.position : null;
    if (focus) {
      position = getSelectionPosition();
    }

    // New match is a merge of previous data
    const newMatch = {
      ...match,
      ...autocomplete,
      suggestions,
      position
    };

    // Update selectedSuggestions if too high
    let { selectedSuggestion } = this.state;
    const lastSuggestionIndex = suggestions.length > 0 ? suggestions.length - 1 : 0;
    if (selectedSuggestion > lastSuggestionIndex) {
      selectedSuggestion = lastSuggestionIndex;
    }

    // Update state
    this.setState({
      match: newMatch,
      selectedSuggestion
    });
  }

  resetMatch() {
    this.setState({
      match: null,
      selectedSuggestions: 0
    })
  }

  /**
   * Clone children with up to date props
   *
   * @returns {Object}
   */
  getChildren() {
    // Remove all props we use and pass this others to DraftJS default Editor component
    const {
      editorState,
      children,
      onChange,
      ...rest
    } = this.props;

    const childrenProps = {
      ...rest,
      editorState,
      onChange,
      onFocus: this.onFocus,
      onBlur: this.onBlur,
      onDownArrow: this.onDownArrow,
      onUpArrow: this.onUpArrow,
      onEscape: this.onEscape,
      onTab: this.onTab,
      keyBindingFn: this.keyBindingFn,
      handleKeyCommand: this.handleKeyCommand      
    };

    return React.Children.map(
      children,
      child => React.cloneElement(child, childrenProps)
    );
  }

  /**
   * Build suggestions list component
   *
   * @returns Component
   */
  buildSuggestionsList() {
    const { focus, match, selectedSuggestion } = this.state;

    if (!match) return null;

    const { suggestions, position } = match;

    if (!suggestions || suggestions.length === 0) return null;

    const List = match.listComponent;
    const Item = match.itemComponent;

    const items = suggestions.map((item, index) => {
      // Create onClick callback for each item so we can pass params
      const onClick = () => {
        this.onSuggestionClick(item, match);
      };
      // Is this item selected
      const selected = selectedSuggestion === index;
      return <Item key={index} item={item} current={selected} onClick={onClick}/>
    });

    return <List display={focus} {...position}>{items}</List>;
  }

  /**
   * Callback when an item was clicked
   *
   * @param item
   * @param match
   */
  onSuggestionClick(item, match) {
    const { editorState, onChange } = this.props;

    // Update editor state
    const newEditorState = addEntityToEditorState(editorState, item, match);
    onChange(newEditorState);

    // Update resetMatch suggestions
    this.setState({
      match: null,
      focus: true // Need to set focus state to true and onFocus doesn't seems to be called
    });
  }

  /**
   * Add entity with item defined by selectedSuggestion
   */
  addEntityWithSelectedSuggestion() {
    const { match, selectedSuggestion } = this.state;
    const { editorState, onChange } = this.props;

    if (match.suggestions[selectedSuggestion]) {
      const item = match.suggestions[selectedSuggestion];
      const newEditorState = addEntityToEditorState(editorState, item, match);
      this.resetMatch();
      onChange(newEditorState);
    }
  }

  onFocus(e) {
    this.setState({
      focus: true
    });

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  }

  onBlur(e) {
    this.setState({
      focus: false
    });

    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  }

  onDownArrow(e) {
    const { focus, match, selectedSuggestion } = this.state;

    // Prevent default if match displayed
    if (focus && match) {
      const lastSuggestionIndex = match.suggestions.length > 0 ? match.suggestions.length - 1 : 0;
      e.preventDefault();

      // Update selectedSuggestion index
      if (selectedSuggestion < (lastSuggestionIndex)) {
        this.setState({
          selectedSuggestion: selectedSuggestion + 1
        });
      }
    }

    if (this.props.onDownArrow) {
      this.props.onDownArrow(e);
    }
  }

  onUpArrow(e) {
    const { focus, match, selectedSuggestion } = this.state;

    // Prevent default if match displayed
    if (focus && match) {
      e.preventDefault();

      // Update selectedSuggestion index
      if (selectedSuggestion > 0) {
        this.setState({
          selectedSuggestion: selectedSuggestion - 1
        });
      }
    }

    if (this.props.onUpArrow) {
      this.props.onUpArrow(e);
    }
  }

  onEscape(e) {
    const { focus, match } = this.state;

    // Prevent default if match displayed
    if (focus && match) {
      e.preventDefault();

      this.setState({
        match: null,
        selectedSuggestion: 0
      })
    }

    if (this.props.onEscape) {
      this.props.onEscape(e);
    }
  }

  onTab(e) {
    const { focus, match } = this.state;

    // Prevent default if match displayed
    if (focus && match) {
      e.preventDefault();
      this.addEntityWithSelectedSuggestion();
    }

    if (this.props.onTab) {
      this.props.onTab(e);
    }
  }

  keyBindingFn(e) {
    const { keyBindingFn } = this.props;
    const { focus, match } = this.state;

    if (focus && match && e.keyCode === 13) {
      return 'add-entity';
    }

    return keyBindingFn ? keyBindingFn(e) : getDefaultKeyBinding(e);
  }

  handleKeyCommand(command) {
    const { handleKeyCommand } = this.props;

    if (command === 'add-entity') {
      this.addEntityWithSelectedSuggestion();
      return 'handled';
    }

    return handleKeyCommand ? handleKeyCommand(command) : 'not-handled';
  }

  render() {
    const childrenWithProps = this.getChildren();
    const suggestions = this.buildSuggestionsList();

    return (
      <React.Fragment>
        {childrenWithProps}
        {suggestions}
      </React.Fragment>
    );
  }
}

export default Autocomplete;
