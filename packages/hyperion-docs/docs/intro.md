---
sidebar_position: 1
---

# Hyperion Introduction

Hyperion is thin and high performance layer that enables
adding [aspects](https://en.wikipedia.org/wiki/Aspect-oriented_programming) to JavaScript.

With aspects, we can avoid littering the main application code
with auxilary logic and you can keep all of the related logic
of a particular aspect in one place.

Hyperion enables **intercepting function, class methods, and attribute accesses on object**. This interception enables unparallel level of "observability" and "control" for aspects.

Hyperion's interception is designed carefully to be JIT friendly with very little performance overhead. The module setup is "tree-shaking" friendly so that you only endup with code that your application really need. Hyperion works well with deep-prototype chains on classes and can eaisly handle inconsistent prototype chains of DOM Classes among various browser implementations. 

Hyperion source code is devided into separate packages to make code dependencies explicit and corresponding modules very composable. Please refer to the packages section to see the purpose of each subcomponents of Hyperion.

## Getting Started

First install hyperion from npm

```bash
npm install hyperionj
```

Now you should decide which feature of Hyperion you want to use. Refer to packages for various features.

## Buidling code

Once you clone the code, install packages and build the code

```bash
git clone https://github.com/facebook/hyperion.git
cd hyperion
npm install
npm run install-packages
npm run build
npm test
```

You can try a test application via the following
```bash
npm run start -w @hyperion/hyperion-react-testapp
```
Once the application opens a new browser tab, make sure to open
dev console to see various types of events events firing.

