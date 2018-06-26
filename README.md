# Draft JS Autocomplete

This component provide you an easy and quickly way to add autocompletion to [draft-js v0.10](https://draftjs.org/).

## Installation

```
yarn add draft-js-autocomplete
```

or

```
npm install --save draft-js-autocomplete
```

## Usage

You first need to define an autocomplete object like the example below :

```
const hashtag = {
  // The prefix to match to enable this
  prefix: '#',
  // Entity type to be created when an item is selected
  type: 'HASHTAG',
  // Mutability of the entity
  mutability: 'IMMUTABLE',
  // Callback called when prefix match. Need to return an array of items you want to display
  onMatch: (text) => hashtags.filter(hashtag => hashtag.indexOf(text) !== -1),
  // The entity component
  component: ({ children }) => (<span className="Hashtag">{children}</span>),
  // The items list component to use
  listComponent: ({ children }) => (<ul className="HashtagList">{children}</ul>),
  // The item component to use
  itemComponent: ({ item, onClick }) => (<li onClick={onClick}>{item}</li>),
  // Callback to format the item as it will be displayed into entity
  format: (item) => `#${item}`
};
```

The second step is to include your actual Editor component with the Autocomplete component, as below :

```
import React, { Component } from 'react';
import './App.css';
import { Editor } from 'draft-js';
import Autocomplete from 'draft-js-autocomplete';

import hashtag from './autocompletes/hashtag';

class App extends Component {

  autocompletes = [
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
    return (
      <Autocomplete editorState={editorState} onChange={this.onChange} autocompletes={this.autocompletes}>
        <Editor />
      </Autocomplete>
    );
  }
}

export default App;
```

### Autocomplete component

Autocomplete accept all the props that draft-js Editor component accept as well as an `autocompletes` prop.

### Example

Check into the `example` folder and its dedicated `README.md`