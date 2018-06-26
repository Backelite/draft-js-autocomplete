import React from 'react';

const hashtags = [
  'react',
  'draft-js',
  'component'
];

const onMatch = (text) => hashtags.filter(hashtag => hashtag.indexOf(text) !== -1);

const Hasthtag = ({ children }) => (
  <span className="Hashtag">{children}</span>
);

const List = ({ display, children }) => {
  return (
    <ul className="HashtagList">{children}</ul>
  );
};

const Item = ({ item, current, onClick }) => {
  let classNames = "HashtagListItem";
  classNames+= current ? " current" : "";
  return (
    <li className={classNames} onClick={onClick}>
      {item}
    </li>
  );
};

const hashtag = {
  prefix: '#',
  type: 'HASHTAG',
  mutability: 'IMMUTABLE',
  onMatch: onMatch,
  component: Hasthtag,
  listComponent: List,
  itemComponent: Item,
  format: (item) => `#${item}`
};

export default hashtag;