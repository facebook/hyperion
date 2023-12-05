/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";

export function getFullNamePattern(simpleName: string): RegExp {
  const parts = simpleName.split('/');
  if (parts[0] == '') {
    /**
     * We expect names in the form of '/f1/f2/f3', i.e. each flowletname
     * preceded by a /.
     * So, dropping the first empty item to have the following work well.
     */
    parts.shift();
  }
  const pattern = parts.map(p => `[/]${p}:\\d+`).join('');
  return new RegExp(pattern);
}
