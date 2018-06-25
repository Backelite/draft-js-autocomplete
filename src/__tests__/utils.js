import { EditorState, convertFromRaw } from 'draft-js';
import {
  addEntityToEditorState,
  findWithRegex,
  getAutocomplete,
  getMatch,
  getSuggestions,
  isCurrentTextEmpty,
  isCurrentSelectionAnEntity
} from '../utils';
import sinon from 'sinon';

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

describe('Utils', () => {
  const contentState = convertFromRaw(contentRaw);
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
  let editorState;

  // Init editor state
  beforeAll(() => editorState = EditorState.createWithContent(contentState));

  // Move selection to first block
  beforeEach(() => editorState = updateSelectionTo(editorState, '5qnrt'));

  it('test findWithRegex', () => {
    const blocks = contentState.getBlockMap();
    const expectedMatches = {
      "5qnrt": [], // Do not match anything in first block
      "deth4": [ { // Match @Jay
        text: 'Jay',
        start: 5,
        end: 9
      } ],
      "bg8np": []
    };
    // Test findWithRegex for each block
    blocks.forEach((block, index) => {
      const callback = sinon.spy();
      const goodRegexp = new RegExp(`(@)(\\S*)(\\s|$)`, 'g');
      const matches = findWithRegex(goodRegexp, block, callback);
      expect(matches).toStrictEqual(expectedMatches[index]);
      expect(callback.called).toEqual(matches.length > 0); // Callback should if be called only when matches
    })
  });

  it('test isCurrentTextEmpty', () => {
    // Move to first block
    let isEmpty = isCurrentTextEmpty(editorState);
    expect(isEmpty).toBeFalsy();

    // Move to last block
    editorState = updateSelectionTo(editorState, 'bg8np');
    isEmpty = isCurrentTextEmpty(editorState);
    expect(isEmpty).toBeTruthy();
  });

  it('test getMatch', () => {
    const matches = {
      "5qnrt": [], // Do not match anything in first block
      "deth4": {
        "MENTION": [ { // Match @Jay
          text: 'Jay',
          start: 5,
          end: 9
        } ]
      }
    };

    // Selection start at 0 in the first block, no match found
    let match = getMatch(editorState, matches);
    expect(match).toBeNull();

    // We move to second block at 0, no match found
    editorState = updateSelectionTo(editorState, 'deth4');
    match = getMatch(editorState, matches);
    expect(match).toBeNull();

    // We move selection to second block on the fifth character, match should be @Jay
    editorState = updateSelectionTo(editorState, 'deth4', 5);
    match = getMatch(editorState, matches);
    expect(match).toStrictEqual({ // Match @Jay
      text: 'Jay',
      start: 5,
      end: 9,
      type: 'MENTION'
    });
  });

  it('test getAutocomplete', () => {
    // We simulate an autocompletes props, just type needed here
    const autocompletes = [ {
      type: 'MENTION'
    }, {
      type: 'HASHTAG'
    } ];

    // We simulate a match returned by getMatch, just type needed here
    let match = {
      type: 'HASHTAG'
    };
    let autocomplete = getAutocomplete(autocompletes, match);
    expect(autocomplete).toStrictEqual(autocompletes[1]);

    // Test an not found autocomplete
    match = {
      type: 'TEST'
    };
    autocomplete = getAutocomplete(autocompletes, match);
    expect(autocomplete).toBeNull();
  });

  it('test getSuggestions', async () => {
    const match = { // Match @Jay
      text: 'Jay',
      start: 5,
      end: 9,
      type: 'MENTION'
    };
    let autocomplete = {};

    // Test no onMatch callback specified
    let suggestions = await getSuggestions(autocomplete, match);
    expect(suggestions).toStrictEqual([]);

    // Test onMatch is called
    const callback = sinon.spy();
    autocomplete['onMatch'] = callback;
    suggestions = await getSuggestions(autocomplete, match);
    expect(callback.called).toBeTruthy();
    expect(callback.args[0][0]).toEqual(match.text);
  });

  it('test addEntityToEditorState', () => {
    const format = (item) => item.firstname;
    const spy = sinon.spy(format);
    const match = { // Match @Jay
      text: 'Jay',
      start: 5,
      end: 9,
      type: 'MENTION',
      mutability: 'SEGMENTED',
      format: spy
    };
    const item = {
      id: 1,
      firstname: 'Jay'
    };

    // Change block
    editorState = updateSelectionTo(editorState, 'deth4');

    // And add entity
    editorState = addEntityToEditorState(editorState, item, match);

    // Test that format callback was called
    expect(spy.called).toBeTruthy();
    expect(spy.args[0][0]).toStrictEqual(item);

    // Last entity created
    const newContentState = editorState.getCurrentContent();
    const lastCreatedEntityKey = newContentState.getLastCreatedEntityKey();
    const entity = newContentState.getEntity(lastCreatedEntityKey);
    expect(entity.get('type')).toEqual(match.type);
    expect(entity.get('mutability')).toEqual(match.mutability);
    expect(entity.get('data')).toEqual(item);

    // Test selection move after the entity
    const newSelection = editorState.getSelection();
    expect(newSelection.anchorOffset).toEqual(8);
  });

  // Need to be tested with an entity into editorState,
  // it's why we are testing it here
  it('test isCurrentSelectionAnEntity', () => {
    // Move to first block
    let isEntity = isCurrentSelectionAnEntity(editorState);
    expect(isEntity).toBeFalsy();

    // Move to second block at entity
    editorState = updateSelectionTo(editorState, 'deth4', 6);
    isEntity = isCurrentSelectionAnEntity(editorState);
    expect(isEntity).toBeTruthy();

    // Move to second block at entity
    editorState = updateSelectionTo(editorState, 'bg8np', 6);
    isEntity = isCurrentSelectionAnEntity(editorState);
    expect(isEntity).toBeFalsy();
  });
});