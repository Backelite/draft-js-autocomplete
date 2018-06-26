import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';
import Autocomplete  from '../';
import { convertFromRaw, Editor, EditorState } from 'draft-js';
import mention from '../../example/src/autocompletes/mention';

// Configure Enzyme
Enzyme.configure({ adapter: new Adapter() });

// Content raw for testing
const contentRaw = {
  "blocks": [ {
    "key": "5qnrt",
    "text": "Bruce Wayne",
    "type": "unstyled",
    "depth": 0,
    "inlineStyleRanges": [],
    "entityRanges": [],
    "data": {}
  }, {
    "key": "deth4",
    "text": "I am @Jay",
    "type": "unstyled",
    "depth": 0,
    "inlineStyleRanges": [],
    "entityRanges": [],
    "data": {}
  }, {
    "key": "bg8np",
    "text": "",
    "type": "unstyled",
    "depth": 0,
    "inlineStyleRanges": [],
    "entityRanges": [],
    "data": {}
  } ], "entityMap": {}
};

describe('Component', () => {
  const contentState = convertFromRaw(contentRaw);
  const autocompletes = [
    mention
  ];
  let editorState;
  const updateSelectionTo = (editorState, blockKey, start = 0, end = 0) => {
    const currentSelectionState = editorState.getSelection();
    const selection = currentSelectionState.merge({
      anchorKey: blockKey,
      focusKey: blockKey,
      anchorOffset: start,
      focusOffset: end,
    });
    return EditorState.forceSelection(editorState, selection);
  };
  const getWrapper = (onChange, props) => {
    return mount(
      <Autocomplete editorState={editorState} onChange={onChange} autocompletes={autocompletes} {...props}>
        <Editor />
      </Autocomplete>
    );
  };

  beforeAll(() => editorState = EditorState.createWithContent(contentState));

  it('test <Autocomplete /> mounting', () => {
    const getDecorator = sinon.spy(Autocomplete.prototype, 'getDecorator');
    const onChange = sinon.spy();

    const wrapper = getWrapper(onChange);

    // We search for editor
    const editor = wrapper.find(Editor);
    expect(editor.length).toEqual(1);

    // We search for content
    const editorContentElement = editor.find('.public-DraftEditor-content');
    expect(editorContentElement.length).toEqual(1);

    // Test that all methods that should be called are called
    expect(getDecorator.callCount).toBe(1);
    expect(onChange.callCount).toBe(1);
    const newEditorState = onChange.args[0][0];

    // And editorState passed to this call should have our decorators
    const decorator = newEditorState.getDecorator();
    expect(decorator).not.toBeNull();
    expect(decorator._decorators.length).toBe(2);
  });

  it('test <Autcomplete /> onChange is called when user typing', () => {
    const onChange = sinon.spy();

    const wrapper = getWrapper(onChange);

    // Simulate user typing
    const editorContentElement = wrapper.find('.public-DraftEditor-content');
    editorContentElement.simulate('beforeInput', { data: 'a' });

    // Should be 2 as onChange is also called on component mounting, see first test
    expect(onChange.callCount).toBe(2);
  });

  it('test <Autcomplete /> getDecorator', () => {
    const createEntityStrategy = sinon.spy(Autocomplete.prototype, 'createEntityStrategy');
    const createAutocompleteStrategy = sinon.spy(Autocomplete.prototype, 'createAutocompleteStrategy');
    const component = getWrapper(() => {}).instance();
    const decorator = component.getDecorator();

    // Testing decorator
    expect(decorator).not.toBeNull();
    expect(decorator._decorators.length).toBe(2);

    // Should be 2 as getDecorator is also called on component mounting, see first test
    expect(createEntityStrategy.callCount).toBe(2);
    expect(typeof createEntityStrategy.returnValues[1]).toBe('function');
    expect(createAutocompleteStrategy.callCount).toBe(2);
    expect(typeof createAutocompleteStrategy.returnValues[1]).toBe('function');
  });

  it('test <Autocomplete /> children props', () => {
    // We cannot test props bound, so we spy them
    const onFocus = sinon.spy(Autocomplete.prototype, 'onFocus');
    const onBlur = sinon.spy(Autocomplete.prototype, 'onBlur');
    const onDownArrow = sinon.spy(Autocomplete.prototype, 'onDownArrow');
    const onUpArrow = sinon.spy(Autocomplete.prototype, 'onUpArrow');
    const onEscape = sinon.spy(Autocomplete.prototype, 'onEscape');
    const onTab = sinon.spy(Autocomplete.prototype, 'onTab');
    const keyBindingFn = sinon.spy(Autocomplete.prototype, 'keyBindingFn');
    const handleKeyCommand = sinon.spy(Autocomplete.prototype, 'handleKeyCommand');

    const onChange = () => { const test = 'onChange testing function' };
    const children = getWrapper(onChange).children();
    const childrenProps = children.props();
    // Testing that children onChange prop is the same that onChange method we pass to Autocomplete component
    expect(childrenProps.onChange.toString()).toBe(onChange.toString());

    childrenProps.onFocus();
    expect(onFocus.called).toBeTruthy();

    childrenProps.onBlur();
    expect(onBlur.called).toBeTruthy();

    childrenProps.onDownArrow();
    expect(onDownArrow.called).toBeTruthy();

    childrenProps.onUpArrow();
    expect(onUpArrow.called).toBeTruthy();

    childrenProps.onEscape();
    expect(onEscape.called).toBeTruthy();

    childrenProps.onTab();
    expect(onTab.called).toBeTruthy();

    childrenProps.keyBindingFn({ keyCode: 'test' });
    expect(keyBindingFn.called).toBeTruthy();

    childrenProps.handleKeyCommand('test');
    expect(handleKeyCommand.called).toBeTruthy();
  });

  it('test <Autocomplete /> props are called', () => {
    const props = {
      onFocus: sinon.spy(),
      onBlur: sinon.spy(),
      onDownArrow: sinon.spy(),
      onUpArrow: sinon.spy(),
      onEscape: sinon.spy(),
      onTab: sinon.spy(),
      keyBindingFn: sinon.spy(),
      handleKeyCommand: sinon.spy()
    };

    const component = getWrapper(() => {}, props).instance();

    component.onFocus();
    expect(props.onFocus.called).toBeTruthy();

    component.onBlur();
    expect(props.onBlur.called).toBeTruthy();

    component.onDownArrow();
    expect(props.onDownArrow.called).toBeTruthy();

    component.onUpArrow();
    expect(props.onUpArrow.called).toBeTruthy();

    component.onEscape();
    expect(props.onEscape.called).toBeTruthy();

    component.onTab();
    expect(props.onTab.called).toBeTruthy();

    component.keyBindingFn();
    expect(props.keyBindingFn.called).toBeTruthy();

    component.handleKeyCommand();
    expect(props.handleKeyCommand.called).toBeTruthy();
  });

  it('test <Autocomplete /> suggestions here', async () => {
    const buildSuggestionsList = sinon.spy(Autocomplete.prototype, 'buildSuggestionsList');
    const onChange = (newEditorState) => editorState = newEditorState;
    let wrapper = getWrapper(onChange);

    // Simulate user typing @
    let editorContentElement = wrapper.find('.public-DraftEditor-content');
    editorContentElement.simulate('beforeInput', { data: '@' });

    // We update wrapper with the new editorState
    wrapper = getWrapper(onChange);
    // We manually call updateMatch
    await wrapper.instance().updateMatch();
    // Expect match to be found
    let match = wrapper.state('match');
    expect(match).not.toBeNull();
    expect(match.text).toBe('Bruce');
    expect(match.start).toBe(0);
    expect(match.end).toBe(6);
    expect(match.suggestions.length).toBe(1);
    expect(buildSuggestionsList.lastCall.returnValue).not.toBeNull();

    editorState = updateSelectionTo(editorState, 'bg8np');
    // We update wrapper with the new editorState
    wrapper = getWrapper(onChange);
    editorContentElement = wrapper.find('.public-DraftEditor-content');
    editorContentElement.simulate('beforeInput', { data: '@P' });

    // We update wrapper with the new editorState
    wrapper = getWrapper(onChange);
    // We manually call updateMatch
    await wrapper.instance().updateMatch();
    match = wrapper.state('match');
    expect(match).not.toBeNull();
    expect(match.text).toBe('P');
    expect(match.start).toBe(0);
    expect(match.end).toBe(2);
    expect(match.suggestions.length).toBe(2);
    expect(buildSuggestionsList.lastCall.returnValue).not.toBeNull();

    // We are moving selection after the @P of the previous test
    editorState = updateSelectionTo(editorState, 'bg8np', 2, 3);
    // We update wrapper with the new editorState
    wrapper = getWrapper(onChange);
    editorContentElement = wrapper.find('.public-DraftEditor-content');
    editorContentElement.simulate('beforeInput', { data: 'atr' });

    // We update wrapper with the new editorState
    wrapper = getWrapper(onChange);
    // We manually call updateMatch
    await wrapper.instance().updateMatch();
    match = wrapper.state('match');
    expect(match).not.toBeNull();
    expect(match.text).toBe('Patr');
    expect(match.start).toBe(0);
    expect(match.end).toBe(5);
    expect(match.suggestions.length).toBe(0);
    expect(buildSuggestionsList.lastCall.returnValue).toBeNull();
  });
});
