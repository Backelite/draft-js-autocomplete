import React from 'react';

const users = [
  {
    firstname: 'Bruce',
    lastname: 'Wayne'
  },
  {
    firstname: 'Jay',
    lastname: 'Garrick'
  },
  {
    firstname: 'Allan',
    lastname: 'Scott'
  },
  {
    firstname: 'Oliver',
    lastname: 'Queen'
  },
  {
    firstname: 'Princess',
    lastname: 'Diana'
  },
  {
    firstname: 'Peter',
    lastname: 'Parker'
  }
];

const onMatch = (text) => users.filter(user => {
  return user.lastname.indexOf(text) !== -1 || user.firstname.indexOf(text) !== -1
});

const Mention = ({ children }) => (
  <span className="Mention">{children}</span>
);

const List = ({ display, children, ...positions }) => {
  const styles = {
    top: positions.bottom,
    left: positions.left
  };
  return (
    <ul className="MentionList" style={styles}>{children}</ul>
  );
};

const Item = ({ item, current, onClick }) => {
  let classNames = "MentionListItem";
  classNames+= current ? " current" : "";
  const name = `${item.firstname} ${item.lastname}`;
  return (
    <li className={classNames} onClick={onClick}>
      {name}
    </li>
  );
};

const mention = {
  prefix: '@',
  type: 'MENTION',
  mutability: 'SEGMENTED',
  onMatch: onMatch,
  component: Mention,
  listComponent: List,
  itemComponent: Item,
  format: (item) => `@${item.firstname} ${item.lastname}`
};

export default mention;