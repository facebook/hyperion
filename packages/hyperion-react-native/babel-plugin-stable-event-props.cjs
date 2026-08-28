/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const DEFAULT_EVENT_PROPS = Object.freeze([
  'onPress',
  'onLongPress',
  'onChangeText',
  'onSubmitEditing',
  'onFocus',
  'onBlur',
  'onRefresh',
]);

module.exports = function stableEventProps({ types: t }, options = {}) {
  const eventProps = new Set(options.eventProps ?? DEFAULT_EVENT_PROPS);

  return {
    name: 'hyperion-react-native-stable-event-props',
    visitor: {
      JSXOpeningElement(path) {
        const attributes = path.node.attributes;
        const explicitProps = new Set();
        for (const attribute of attributes) {
          if (
            t.isJSXAttribute(attribute) &&
            t.isJSXIdentifier(attribute.name)
          ) {
            explicitProps.add(attribute.name.name);
          }
        }

        const insertions = new Map();
        let unknownSpreadSeen = false;
        for (const attribute of attributes) {
          if (!t.isJSXSpreadAttribute(attribute)) continue;
          const names = getConditionalObjectKeys(t, attribute.argument);
          if (names == null) {
            unknownSpreadSeen = true;
            continue;
          }
          for (const name of names) {
            if (
              eventProps.has(name) &&
              !explicitProps.has(name) &&
              !insertions.has(name) &&
              !unknownSpreadSeen
            ) {
              insertions.set(name, attribute);
            }
          }
        }

        for (const [name, before] of insertions) {
          const index = attributes.indexOf(before);
          attributes.splice(
            index,
            0,
            t.jsxAttribute(
              t.jsxIdentifier(name),
              t.jsxExpressionContainer(t.identifier('undefined'))
            )
          );
        }
      },
    },
  };
};

module.exports.DEFAULT_EVENT_PROPS = DEFAULT_EVENT_PROPS;

function getConditionalObjectKeys(t, expression) {
  const objects = [];
  if (t.isConditionalExpression(expression)) {
    objects.push(expression.consequent, expression.alternate);
  } else if (
    t.isLogicalExpression(expression) &&
    expression.operator === '&&'
  ) {
    objects.push(expression.right);
  } else {
    return null;
  }

  const names = new Set();
  for (const object of objects) {
    if (!t.isObjectExpression(object)) continue;
    for (const property of object.properties) {
      if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
        continue;
      }
      if (property.computed) continue;
      if (t.isIdentifier(property.key)) names.add(property.key.name);
      if (t.isStringLiteral(property.key)) names.add(property.key.value);
    }
  }
  return names;
}
