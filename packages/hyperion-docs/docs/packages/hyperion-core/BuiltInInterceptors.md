---
sidebar_position: 10
---

# Builtin JS interceptors

The `hyperion-core` package already contains ready main interceptors for the following JS objects
* IGlobalThis provides interceptors for global methods such as (setTimeout, setInterval)
* IPromise provies interceptos for all `Promise` methods and constructors
* IRequre provide interceptors for typical implementations of js `require` funcationality which can be used to investigate modules and bootstrap further interception of their output.