import React from 'react';

const SafeAnchor = props => {
  const onClick = event => {
    event.preventDefault();
    props.onClick(event);
  };
  return <a href="#" {...props} onClick={onClick} />;
};

export default SafeAnchor;
