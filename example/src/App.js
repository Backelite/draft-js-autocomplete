import React, { Component } from 'react';
import './App.css';
import { Editor, EditorState } from 'draft-js';
import Autocomplete from 'draft-js-autocomplete';

import 'draft-js/dist/Draft.css';

import mention from './autocompletes/mention';
import hashtag from './autocompletes/hashtag';

import './autocompletes/mention.css';
import './autocompletes/hashtag.css';

class App extends Component {

  autocompletes = [
    mention,
    hashtag
  ];

  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty()
    }
  }

  onChange = (editorState) => {
    this.setState({ editorState })
  };

  render() {
    const { editorState } = this.state;

    return (
      <React.Fragment>
        <h1 className="Title">Draft-JS Autocomplete example</h1>
        <div className="Editor">
          <Autocomplete editorState={editorState} onChange={this.onChange} autocompletes={this.autocompletes}>
            <Editor />
          </Autocomplete>
        </div>
      </React.Fragment>
    );
  }
}

export default App;
