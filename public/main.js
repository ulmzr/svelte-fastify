(() => {
  // node_modules/svelte/src/runtime/internal/utils.js
  function noop() {
  }
  function run(fn) {
    return fn();
  }
  function blank_object() {
    return /* @__PURE__ */ Object.create(null);
  }
  function run_all(fns) {
    fns.forEach(run);
  }
  function is_function(thing) {
    return typeof thing === "function";
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
  }
  function is_empty(obj) {
    return Object.keys(obj).length === 0;
  }
  function null_to_empty(value) {
    return value == null ? "" : value;
  }

  // node_modules/svelte/src/runtime/internal/globals.js
  var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
    // @ts-ignore Node typings have this
    global
  );

  // node_modules/svelte/src/runtime/internal/ResizeObserverSingleton.js
  var ResizeObserverSingleton = class _ResizeObserverSingleton {
    /**
     * @private
     * @readonly
     * @type {WeakMap<Element, import('./private.js').Listener>}
     */
    _listeners = "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0;
    /**
     * @private
     * @type {ResizeObserver}
     */
    _observer = void 0;
    /** @type {ResizeObserverOptions} */
    options;
    /** @param {ResizeObserverOptions} options */
    constructor(options) {
      this.options = options;
    }
    /**
     * @param {Element} element
     * @param {import('./private.js').Listener} listener
     * @returns {() => void}
     */
    observe(element2, listener) {
      this._listeners.set(element2, listener);
      this._getObserver().observe(element2, this.options);
      return () => {
        this._listeners.delete(element2);
        this._observer.unobserve(element2);
      };
    }
    /**
     * @private
     */
    _getObserver() {
      return this._observer ?? (this._observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          _ResizeObserverSingleton.entries.set(entry.target, entry);
          this._listeners.get(entry.target)?.(entry);
        }
      }));
    }
  };
  ResizeObserverSingleton.entries = "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0;

  // node_modules/svelte/src/runtime/internal/dom.js
  var is_hydrating = false;
  function start_hydrating() {
    is_hydrating = true;
  }
  function end_hydrating() {
    is_hydrating = false;
  }
  function append(target, node) {
    target.appendChild(node);
  }
  function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
  }
  function detach(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
  function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
      if (iterations[i])
        iterations[i].d(detaching);
    }
  }
  function element(name) {
    return document.createElement(name);
  }
  function text(data) {
    return document.createTextNode(data);
  }
  function space() {
    return text(" ");
  }
  function empty() {
    return text("");
  }
  function attr(node, attribute, value) {
    if (value == null)
      node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
      node.setAttribute(attribute, value);
  }
  function children(element2) {
    return Array.from(element2.childNodes);
  }
  function set_data(text2, data) {
    data = "" + data;
    if (text2.data === data)
      return;
    text2.data = /** @type {string} */
    data;
  }
  function get_custom_elements_slots(element2) {
    const result = {};
    element2.childNodes.forEach(
      /** @param {Element} node */
      (node) => {
        result[node.slot || "default"] = true;
      }
    );
    return result;
  }
  function construct_svelte_component(component, props) {
    return new component(props);
  }

  // node_modules/svelte/src/runtime/internal/lifecycle.js
  var current_component;
  function set_current_component(component) {
    current_component = component;
  }
  function get_current_component() {
    if (!current_component)
      throw new Error("Function called outside component initialization");
    return current_component;
  }
  function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
  }
  function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
  }

  // node_modules/svelte/src/runtime/internal/scheduler.js
  var dirty_components = [];
  var binding_callbacks = [];
  var render_callbacks = [];
  var flush_callbacks = [];
  var resolved_promise = /* @__PURE__ */ Promise.resolve();
  var update_scheduled = false;
  function schedule_update() {
    if (!update_scheduled) {
      update_scheduled = true;
      resolved_promise.then(flush);
    }
  }
  function add_render_callback(fn) {
    render_callbacks.push(fn);
  }
  var seen_callbacks = /* @__PURE__ */ new Set();
  var flushidx = 0;
  function flush() {
    if (flushidx !== 0) {
      return;
    }
    const saved_component = current_component;
    do {
      try {
        while (flushidx < dirty_components.length) {
          const component = dirty_components[flushidx];
          flushidx++;
          set_current_component(component);
          update(component.$$);
        }
      } catch (e) {
        dirty_components.length = 0;
        flushidx = 0;
        throw e;
      }
      set_current_component(null);
      dirty_components.length = 0;
      flushidx = 0;
      while (binding_callbacks.length)
        binding_callbacks.pop()();
      for (let i = 0; i < render_callbacks.length; i += 1) {
        const callback = render_callbacks[i];
        if (!seen_callbacks.has(callback)) {
          seen_callbacks.add(callback);
          callback();
        }
      }
      render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
      flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
  }
  function update($$) {
    if ($$.fragment !== null) {
      $$.update();
      run_all($$.before_update);
      const dirty = $$.dirty;
      $$.dirty = [-1];
      $$.fragment && $$.fragment.p($$.ctx, dirty);
      $$.after_update.forEach(add_render_callback);
    }
  }
  function flush_render_callbacks(fns) {
    const filtered = [];
    const targets = [];
    render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
    targets.forEach((c) => c());
    render_callbacks = filtered;
  }

  // node_modules/svelte/src/runtime/internal/transitions.js
  var outroing = /* @__PURE__ */ new Set();
  var outros;
  function group_outros() {
    outros = {
      r: 0,
      c: [],
      p: outros
      // parent group
    };
  }
  function check_outros() {
    if (!outros.r) {
      run_all(outros.c);
    }
    outros = outros.p;
  }
  function transition_in(block, local) {
    if (block && block.i) {
      outroing.delete(block);
      block.i(local);
    }
  }
  function transition_out(block, local, detach2, callback) {
    if (block && block.o) {
      if (outroing.has(block))
        return;
      outroing.add(block);
      outros.c.push(() => {
        outroing.delete(block);
        if (callback) {
          if (detach2)
            block.d(1);
          callback();
        }
      });
      block.o(local);
    } else if (callback) {
      callback();
    }
  }

  // node_modules/svelte/src/runtime/internal/each.js
  function ensure_array_like(array_like_or_iterator) {
    return array_like_or_iterator?.length !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
  }

  // node_modules/svelte/src/shared/boolean_attributes.js
  var _boolean_attributes = (
    /** @type {const} */
    [
      "allowfullscreen",
      "allowpaymentrequest",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "controls",
      "default",
      "defer",
      "disabled",
      "formnovalidate",
      "hidden",
      "inert",
      "ismap",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected"
    ]
  );
  var boolean_attributes = /* @__PURE__ */ new Set([..._boolean_attributes]);

  // node_modules/svelte/src/runtime/internal/Component.js
  function create_component(block) {
    block && block.c();
  }
  function mount_component(component, target, anchor) {
    const { fragment, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
      flush_render_callbacks($$.after_update);
      run_all($$.on_destroy);
      $$.fragment && $$.fragment.d(detaching);
      $$.on_destroy = $$.fragment = null;
      $$.ctx = [];
    }
  }
  function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
      dirty_components.push(component);
      schedule_update();
      component.$$.dirty.fill(0);
    }
    component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
  }
  function init(component, options, instance5, create_fragment7, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
      fragment: null,
      ctx: [],
      // state
      props,
      update: noop,
      not_equal,
      bound: blank_object(),
      // lifecycle
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
      // everything else
      callbacks: blank_object(),
      dirty,
      skip_bound: false,
      root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance5 ? instance5(component, options.props || {}, (i, ret, ...rest) => {
      const value = rest.length ? rest[0] : ret;
      if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
        if (!$$.skip_bound && $$.bound[i])
          $$.bound[i](value);
        if (ready)
          make_dirty(component, i);
      }
      return ret;
    }) : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment7 ? create_fragment7($$.ctx) : false;
    if (options.target) {
      if (options.hydrate) {
        start_hydrating();
        const nodes = children(options.target);
        $$.fragment && $$.fragment.l(nodes);
        nodes.forEach(detach);
      } else {
        $$.fragment && $$.fragment.c();
      }
      if (options.intro)
        transition_in(component.$$.fragment);
      mount_component(component, options.target, options.anchor);
      end_hydrating();
      flush();
    }
    set_current_component(parent_component);
  }
  var SvelteElement;
  if (typeof HTMLElement === "function") {
    SvelteElement = class extends HTMLElement {
      /** The Svelte component constructor */
      $$ctor;
      /** Slots */
      $$s;
      /** The Svelte component instance */
      $$c;
      /** Whether or not the custom element is connected */
      $$cn = false;
      /** Component props data */
      $$d = {};
      /** `true` if currently in the process of reflecting component props back to attributes */
      $$r = false;
      /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
      $$p_d = {};
      /** @type {Record<string, Function[]>} Event listeners */
      $$l = {};
      /** @type {Map<Function, Function>} Event listener unsubscribe functions */
      $$l_u = /* @__PURE__ */ new Map();
      constructor($$componentCtor, $$slots, use_shadow_dom) {
        super();
        this.$$ctor = $$componentCtor;
        this.$$s = $$slots;
        if (use_shadow_dom) {
          this.attachShadow({ mode: "open" });
        }
      }
      addEventListener(type, listener, options) {
        this.$$l[type] = this.$$l[type] || [];
        this.$$l[type].push(listener);
        if (this.$$c) {
          const unsub = this.$$c.$on(type, listener);
          this.$$l_u.set(listener, unsub);
        }
        super.addEventListener(type, listener, options);
      }
      removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, options);
        if (this.$$c) {
          const unsub = this.$$l_u.get(listener);
          if (unsub) {
            unsub();
            this.$$l_u.delete(listener);
          }
        }
      }
      async connectedCallback() {
        this.$$cn = true;
        if (!this.$$c) {
          let create_slot = function(name) {
            return () => {
              let node;
              const obj = {
                c: function create() {
                  node = element("slot");
                  if (name !== "default") {
                    attr(node, "name", name);
                  }
                },
                /**
                 * @param {HTMLElement} target
                 * @param {HTMLElement} [anchor]
                 */
                m: function mount(target, anchor) {
                  insert(target, node, anchor);
                },
                d: function destroy(detaching) {
                  if (detaching) {
                    detach(node);
                  }
                }
              };
              return obj;
            };
          };
          await Promise.resolve();
          if (!this.$$cn) {
            return;
          }
          const $$slots = {};
          const existing_slots = get_custom_elements_slots(this);
          for (const name of this.$$s) {
            if (name in existing_slots) {
              $$slots[name] = [create_slot(name)];
            }
          }
          for (const attribute of this.attributes) {
            const name = this.$$g_p(attribute.name);
            if (!(name in this.$$d)) {
              this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
            }
          }
          this.$$c = new this.$$ctor({
            target: this.shadowRoot || this,
            props: {
              ...this.$$d,
              $$slots,
              $$scope: {
                ctx: []
              }
            }
          });
          const reflect_attributes = () => {
            this.$$r = true;
            for (const key in this.$$p_d) {
              this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]];
              if (this.$$p_d[key].reflect) {
                const attribute_value = get_custom_element_value(
                  key,
                  this.$$d[key],
                  this.$$p_d,
                  "toAttribute"
                );
                if (attribute_value == null) {
                  this.removeAttribute(key);
                } else {
                  this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
                }
              }
            }
            this.$$r = false;
          };
          this.$$c.$$.after_update.push(reflect_attributes);
          reflect_attributes();
          for (const type in this.$$l) {
            for (const listener of this.$$l[type]) {
              const unsub = this.$$c.$on(type, listener);
              this.$$l_u.set(listener, unsub);
            }
          }
          this.$$l = {};
        }
      }
      // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
      // and setting attributes through setAttribute etc, this is helpful
      attributeChangedCallback(attr2, _oldValue, newValue) {
        if (this.$$r)
          return;
        attr2 = this.$$g_p(attr2);
        this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
        this.$$c?.$set({ [attr2]: this.$$d[attr2] });
      }
      disconnectedCallback() {
        this.$$cn = false;
        Promise.resolve().then(() => {
          if (!this.$$cn) {
            this.$$c.$destroy();
            this.$$c = void 0;
          }
        });
      }
      $$g_p(attribute_name) {
        return Object.keys(this.$$p_d).find(
          (key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name
        ) || attribute_name;
      }
    };
  }
  function get_custom_element_value(prop, value, props_definition, transform) {
    const type = props_definition[prop]?.type;
    value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
    if (!transform || !props_definition[prop]) {
      return value;
    } else if (transform === "toAttribute") {
      switch (type) {
        case "Object":
        case "Array":
          return value == null ? null : JSON.stringify(value);
        case "Boolean":
          return value ? "" : null;
        case "Number":
          return value == null ? null : value;
        default:
          return value;
      }
    } else {
      switch (type) {
        case "Object":
        case "Array":
          return value && JSON.parse(value);
        case "Boolean":
          return value;
        case "Number":
          return value != null ? +value : value;
        default:
          return value;
      }
    }
  }
  var SvelteComponent = class {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    $$ = void 0;
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    $$set = void 0;
    /** @returns {void} */
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop;
    }
    /**
     * @template {Extract<keyof Events, string>} K
     * @param {K} type
     * @param {((e: Events[K]) => void) | null | undefined} callback
     * @returns {() => void}
     */
    $on(type, callback) {
      if (!is_function(callback)) {
        return noop;
      }
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    /**
     * @param {Partial<Props>} props
     * @returns {void}
     */
    $set(props) {
      if (this.$$set && !is_empty(props)) {
        this.$$.skip_bound = true;
        this.$$set(props);
        this.$$.skip_bound = false;
      }
    }
  };

  // node_modules/svelte/src/shared/version.js
  var PUBLIC_VERSION = "4";

  // node_modules/svelte/src/runtime/internal/disclose-version/index.js
  if (typeof window !== "undefined")
    (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);

  // node_modules/regexparam/dist/regexparam.mjs
  function regexparam_default(str, loose) {
    if (str instanceof RegExp)
      return { keys: false, pattern: str };
    var c, o, tmp, ext, keys = [], pattern = "", arr = str.split("/");
    arr[0] || arr.shift();
    while (tmp = arr.shift()) {
      c = tmp[0];
      if (c === "*") {
        keys.push("wild");
        pattern += "/(.*)";
      } else if (c === ":") {
        o = tmp.indexOf("?", 1);
        ext = tmp.indexOf(".", 1);
        keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
        pattern += !!~o && !~ext ? "(?:/([^/]+?))?" : "/([^/]+?)";
        if (!!~ext)
          pattern += (!!~o ? "?" : "") + "\\" + tmp.substring(ext);
      } else {
        pattern += "/" + tmp;
      }
    }
    return {
      keys,
      pattern: new RegExp("^" + pattern + (loose ? "(?=$|/)" : "/?$"), "i")
    };
  }

  // node_modules/navaid/dist/navaid.mjs
  function Navaid(base, on404) {
    var rgx, curr, routes = [], $ = {};
    var fmt = $.format = function(uri) {
      if (!uri)
        return uri;
      uri = "/" + uri.replace(/^\/|\/$/g, "");
      return rgx.test(uri) && uri.replace(rgx, "/");
    };
    base = "/" + (base || "").replace(/^\/|\/$/g, "");
    rgx = base == "/" ? /^\/+/ : new RegExp("^\\" + base + "(?=\\/|$)\\/?", "i");
    $.route = function(uri, replace) {
      if (uri[0] == "/" && !rgx.test(uri))
        uri = base + uri;
      history[(uri === curr || replace ? "replace" : "push") + "State"](uri, null, uri);
    };
    $.on = function(pat, fn) {
      (pat = regexparam_default(pat)).fn = fn;
      routes.push(pat);
      return $;
    };
    $.run = function(uri) {
      var i = 0, params = {}, arr, obj;
      if (uri = fmt(uri || location.pathname)) {
        uri = uri.match(/[^\?#]*/)[0];
        for (curr = uri; i < routes.length; i++) {
          if (arr = (obj = routes[i]).pattern.exec(uri)) {
            for (i = 0; i < obj.keys.length; ) {
              params[obj.keys[i]] = arr[++i] || null;
            }
            obj.fn(params);
            return $;
          }
        }
        if (on404)
          on404(uri);
      }
      return $;
    };
    $.listen = function(u) {
      wrap("push");
      wrap("replace");
      function run2(e) {
        $.run();
      }
      function click(e) {
        var x = e.target.closest("a"), y = x && x.getAttribute("href");
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented)
          return;
        if (!y || x.target || x.host !== location.host || y[0] == "#")
          return;
        if (y[0] != "/" || rgx.test(y)) {
          e.preventDefault();
          $.route(y);
        }
      }
      addEventListener("popstate", run2);
      addEventListener("replacestate", run2);
      addEventListener("pushstate", run2);
      addEventListener("click", click);
      $.unlisten = function() {
        removeEventListener("popstate", run2);
        removeEventListener("replacestate", run2);
        removeEventListener("pushstate", run2);
        removeEventListener("click", click);
      };
      return $.run(u);
    };
    return $;
  }
  function wrap(type, fn) {
    if (history[type])
      return;
    history[type] = type;
    fn = history[type += "State"];
    history[type] = function(uri) {
      var ev = new Event(type.toLowerCase());
      ev.uri = uri;
      fn.apply(this, arguments);
      return dispatchEvent(ev);
    };
  }

  // src/components/Nav.svelte
  function create_fragment(ctx) {
    let nav;
    let ul;
    let li0;
    let a0;
    let t0;
    let a0_class_value;
    let t1;
    let li1;
    let a1;
    let t2;
    let a1_class_value;
    let t3;
    let li2;
    let a2;
    let t4;
    let a2_class_value;
    return {
      c() {
        nav = element("nav");
        ul = element("ul");
        li0 = element("li");
        a0 = element("a");
        t0 = text("home");
        t1 = space();
        li1 = element("li");
        a1 = element("a");
        t2 = text("about");
        t3 = space();
        li2 = element("li");
        a2 = element("a");
        t4 = text("blog");
        attr(a0, "class", a0_class_value = null_to_empty(
          /*isActive*/
          ctx[0]("home")
        ) + " svelte-kbxk7q");
        attr(a0, "href", "/");
        attr(li0, "class", "svelte-kbxk7q");
        attr(a1, "class", a1_class_value = null_to_empty(
          /*isActive*/
          ctx[0]("about")
        ) + " svelte-kbxk7q");
        attr(a1, "href", "/about");
        attr(li1, "class", "svelte-kbxk7q");
        attr(a2, "class", a2_class_value = null_to_empty(
          /*isActive*/
          ctx[0]("blog")
        ) + " svelte-kbxk7q");
        attr(a2, "href", "/blog");
        attr(li2, "class", "svelte-kbxk7q");
        attr(ul, "class", "svelte-kbxk7q");
        attr(nav, "class", "svelte-kbxk7q");
      },
      m(target, anchor) {
        insert(target, nav, anchor);
        append(nav, ul);
        append(ul, li0);
        append(li0, a0);
        append(a0, t0);
        append(ul, t1);
        append(ul, li1);
        append(li1, a1);
        append(a1, t2);
        append(ul, t3);
        append(ul, li2);
        append(li2, a2);
        append(a2, t4);
      },
      p(ctx2, [dirty]) {
        if (dirty & /*isActive*/
        1 && a0_class_value !== (a0_class_value = null_to_empty(
          /*isActive*/
          ctx2[0]("home")
        ) + " svelte-kbxk7q")) {
          attr(a0, "class", a0_class_value);
        }
        if (dirty & /*isActive*/
        1 && a1_class_value !== (a1_class_value = null_to_empty(
          /*isActive*/
          ctx2[0]("about")
        ) + " svelte-kbxk7q")) {
          attr(a1, "class", a1_class_value);
        }
        if (dirty & /*isActive*/
        1 && a2_class_value !== (a2_class_value = null_to_empty(
          /*isActive*/
          ctx2[0]("blog")
        ) + " svelte-kbxk7q")) {
          attr(a2, "class", a2_class_value);
        }
      },
      i: noop,
      o: noop,
      d(detaching) {
        if (detaching) {
          detach(nav);
        }
      }
    };
  }
  function instance($$self, $$props, $$invalidate) {
    let isActive;
    let { active } = $$props;
    $$self.$$set = ($$props2) => {
      if ("active" in $$props2)
        $$invalidate(1, active = $$props2.active);
    };
    $$self.$$.update = () => {
      if ($$self.$$.dirty & /*active*/
      2) {
        $:
          $$invalidate(0, isActive = (str) => active === str ? "selected" : "");
      }
    };
    return [isActive, active];
  }
  var Nav = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, instance, create_fragment, safe_not_equal, { active: 1 });
    }
  };
  var Nav_default = Nav;

  // src/pages/Home.svelte
  function create_fragment2(ctx) {
    let t0;
    let h1;
    let t2;
    let figure;
    return {
      c() {
        t0 = space();
        h1 = element("h1");
        h1.textContent = "Great success!";
        t2 = space();
        figure = element("figure");
        figure.innerHTML = `<img src="/img/logo.svg" alt="" class="svelte-zl0e1a"/> <figcaption>Good Job!</figcaption>`;
        document.title = "Svelte Demo template";
        attr(h1, "class", "svelte-zl0e1a");
        attr(figure, "class", "svelte-zl0e1a");
      },
      m(target, anchor) {
        insert(target, t0, anchor);
        insert(target, h1, anchor);
        insert(target, t2, anchor);
        insert(target, figure, anchor);
      },
      p: noop,
      i: noop,
      o: noop,
      d(detaching) {
        if (detaching) {
          detach(t0);
          detach(h1);
          detach(t2);
          detach(figure);
        }
      }
    };
  }
  var Home = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, null, create_fragment2, safe_not_equal, {});
    }
  };
  var Home_default = Home;

  // src/pages/Blog.svelte
  function get_each_context(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[1] = list[i];
    return child_ctx;
  }
  function create_if_block(ctx) {
    let ul;
    let each_value = ensure_array_like(
      /*posts*/
      ctx[0]
    );
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
      each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    }
    return {
      c() {
        ul = element("ul");
        for (let i = 0; i < each_blocks.length; i += 1) {
          each_blocks[i].c();
        }
        attr(ul, "class", "svelte-7xvheh");
      },
      m(target, anchor) {
        insert(target, ul, anchor);
        for (let i = 0; i < each_blocks.length; i += 1) {
          if (each_blocks[i]) {
            each_blocks[i].m(ul, null);
          }
        }
      },
      p(ctx2, dirty) {
        if (dirty & /*posts*/
        1) {
          each_value = ensure_array_like(
            /*posts*/
            ctx2[0]
          );
          let i;
          for (i = 0; i < each_value.length; i += 1) {
            const child_ctx = get_each_context(ctx2, each_value, i);
            if (each_blocks[i]) {
              each_blocks[i].p(child_ctx, dirty);
            } else {
              each_blocks[i] = create_each_block(child_ctx);
              each_blocks[i].c();
              each_blocks[i].m(ul, null);
            }
          }
          for (; i < each_blocks.length; i += 1) {
            each_blocks[i].d(1);
          }
          each_blocks.length = each_value.length;
        }
      },
      d(detaching) {
        if (detaching) {
          detach(ul);
        }
        destroy_each(each_blocks, detaching);
      }
    };
  }
  function create_each_block(ctx) {
    let li;
    let a;
    let t_value = (
      /*post*/
      ctx[1].title + ""
    );
    let t;
    let a_href_value;
    return {
      c() {
        li = element("li");
        a = element("a");
        t = text(t_value);
        attr(a, "href", a_href_value = "/blog/" + /*post*/
        ctx[1].id);
      },
      m(target, anchor) {
        insert(target, li, anchor);
        append(li, a);
        append(a, t);
      },
      p(ctx2, dirty) {
        if (dirty & /*posts*/
        1 && t_value !== (t_value = /*post*/
        ctx2[1].title + ""))
          set_data(t, t_value);
        if (dirty & /*posts*/
        1 && a_href_value !== (a_href_value = "/blog/" + /*post*/
        ctx2[1].id)) {
          attr(a, "href", a_href_value);
        }
      },
      d(detaching) {
        if (detaching) {
          detach(li);
        }
      }
    };
  }
  function create_fragment3(ctx) {
    let t0;
    let h1;
    let t2;
    let if_block_anchor;
    let if_block = (
      /*posts*/
      ctx[0] && create_if_block(ctx)
    );
    return {
      c() {
        t0 = space();
        h1 = element("h1");
        h1.textContent = "Recent posts";
        t2 = space();
        if (if_block)
          if_block.c();
        if_block_anchor = empty();
        document.title = "Blog";
      },
      m(target, anchor) {
        insert(target, t0, anchor);
        insert(target, h1, anchor);
        insert(target, t2, anchor);
        if (if_block)
          if_block.m(target, anchor);
        insert(target, if_block_anchor, anchor);
      },
      p(ctx2, [dirty]) {
        if (
          /*posts*/
          ctx2[0]
        ) {
          if (if_block) {
            if_block.p(ctx2, dirty);
          } else {
            if_block = create_if_block(ctx2);
            if_block.c();
            if_block.m(if_block_anchor.parentNode, if_block_anchor);
          }
        } else if (if_block) {
          if_block.d(1);
          if_block = null;
        }
      },
      i: noop,
      o: noop,
      d(detaching) {
        if (detaching) {
          detach(t0);
          detach(h1);
          detach(t2);
          detach(if_block_anchor);
        }
        if (if_block)
          if_block.d(detaching);
      }
    };
  }
  function instance2($$self, $$props, $$invalidate) {
    let posts = [];
    onMount(async () => {
      fetch("https://jsonplaceholder.typicode.com/posts").then((r) => r.json()).then((arr) => {
        $$invalidate(0, posts = arr);
      });
    });
    return [posts];
  }
  var Blog = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, instance2, create_fragment3, safe_not_equal, {});
    }
  };
  var Blog_default = Blog;

  // src/pages/About.svelte
  function create_fragment4(ctx) {
    let t0;
    let h1;
    let t2;
    let p;
    return {
      c() {
        t0 = space();
        h1 = element("h1");
        h1.textContent = "About this site";
        t2 = space();
        p = element("p");
        p.textContent = "This is the 'about' page. There's not much here.";
        document.title = "About";
      },
      m(target, anchor) {
        insert(target, t0, anchor);
        insert(target, h1, anchor);
        insert(target, t2, anchor);
        insert(target, p, anchor);
      },
      p: noop,
      i: noop,
      o: noop,
      d(detaching) {
        if (detaching) {
          detach(t0);
          detach(h1);
          detach(t2);
          detach(p);
        }
      }
    };
  }
  var About = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, null, create_fragment4, safe_not_equal, {});
    }
  };
  var About_default = About;

  // src/pages/Article.svelte
  function create_if_block2(ctx) {
    let h1;
    let t0_value = (
      /*post*/
      ctx[0].title + ""
    );
    let t0;
    let t1;
    let div;
    let raw_value = (
      /*post*/
      ctx[0].body + ""
    );
    return {
      c() {
        h1 = element("h1");
        t0 = text(t0_value);
        t1 = space();
        div = element("div");
        attr(div, "class", "content svelte-19r337u");
      },
      m(target, anchor) {
        insert(target, h1, anchor);
        append(h1, t0);
        insert(target, t1, anchor);
        insert(target, div, anchor);
        div.innerHTML = raw_value;
      },
      p(ctx2, dirty) {
        if (dirty & /*post*/
        1 && t0_value !== (t0_value = /*post*/
        ctx2[0].title + ""))
          set_data(t0, t0_value);
        if (dirty & /*post*/
        1 && raw_value !== (raw_value = /*post*/
        ctx2[0].body + ""))
          div.innerHTML = raw_value;
        ;
      },
      d(detaching) {
        if (detaching) {
          detach(h1);
          detach(t1);
          detach(div);
        }
      }
    };
  }
  function create_fragment5(ctx) {
    let t;
    let if_block_anchor;
    let if_block = (
      /*post*/
      ctx[0] && create_if_block2(ctx)
    );
    return {
      c() {
        t = space();
        if (if_block)
          if_block.c();
        if_block_anchor = empty();
        document.title = "Post";
      },
      m(target, anchor) {
        insert(target, t, anchor);
        if (if_block)
          if_block.m(target, anchor);
        insert(target, if_block_anchor, anchor);
      },
      p(ctx2, [dirty]) {
        if (
          /*post*/
          ctx2[0]
        ) {
          if (if_block) {
            if_block.p(ctx2, dirty);
          } else {
            if_block = create_if_block2(ctx2);
            if_block.c();
            if_block.m(if_block_anchor.parentNode, if_block_anchor);
          }
        } else if (if_block) {
          if_block.d(1);
          if_block = null;
        }
      },
      i: noop,
      o: noop,
      d(detaching) {
        if (detaching) {
          detach(t);
          detach(if_block_anchor);
        }
        if (if_block)
          if_block.d(detaching);
      }
    };
  }
  async function load(postid) {
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postid}`).then((r) => r.json());
  }
  function instance3($$self, $$props, $$invalidate) {
    let { params = {} } = $$props;
    let post;
    onMount(() => {
      load(params.postid).then((obj) => $$invalidate(0, post = obj));
    });
    $$self.$$set = ($$props2) => {
      if ("params" in $$props2)
        $$invalidate(1, params = $$props2.params);
    };
    $$self.$$.update = () => {
      if ($$self.$$.dirty & /*params*/
      2) {
        $:
          load(params.postid).then((obj) => $$invalidate(0, post = obj));
      }
    };
    return [post, params];
  }
  var Article = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, instance3, create_fragment5, safe_not_equal, { params: 1 });
    }
  };
  var Article_default = Article;

  // src/App.svelte
  function create_else_block(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    var switch_value = (
      /*Route*/
      ctx[0]
    );
    function switch_props(ctx2, dirty) {
      return { props: { params: (
        /*params*/
        ctx2[1]
      ) } };
    }
    if (switch_value) {
      switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
    }
    return {
      c() {
        if (switch_instance)
          create_component(switch_instance.$$.fragment);
        switch_instance_anchor = empty();
      },
      m(target, anchor) {
        if (switch_instance)
          mount_component(switch_instance, target, anchor);
        insert(target, switch_instance_anchor, anchor);
        current = true;
      },
      p(ctx2, dirty) {
        if (dirty & /*Route*/
        1 && switch_value !== (switch_value = /*Route*/
        ctx2[0])) {
          if (switch_instance) {
            group_outros();
            const old_component = switch_instance;
            transition_out(old_component.$$.fragment, 1, 0, () => {
              destroy_component(old_component, 1);
            });
            check_outros();
          }
          if (switch_value) {
            switch_instance = construct_svelte_component(switch_value, switch_props(ctx2, dirty));
            create_component(switch_instance.$$.fragment);
            transition_in(switch_instance.$$.fragment, 1);
            mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
          } else {
            switch_instance = null;
          }
        } else if (switch_value) {
          const switch_instance_changes = {};
          if (dirty & /*params*/
          2)
            switch_instance_changes.params = /*params*/
            ctx2[1];
          switch_instance.$set(switch_instance_changes);
        }
      },
      i(local) {
        if (current)
          return;
        if (switch_instance)
          transition_in(switch_instance.$$.fragment, local);
        current = true;
      },
      o(local) {
        if (switch_instance)
          transition_out(switch_instance.$$.fragment, local);
        current = false;
      },
      d(detaching) {
        if (detaching) {
          detach(switch_instance_anchor);
        }
        if (switch_instance)
          destroy_component(switch_instance, detaching);
      }
    };
  }
  function create_if_block3(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    var switch_value = (
      /*Route*/
      ctx[0]
    );
    function switch_props(ctx2, dirty) {
      return {};
    }
    if (switch_value) {
      switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
    }
    return {
      c() {
        if (switch_instance)
          create_component(switch_instance.$$.fragment);
        switch_instance_anchor = empty();
      },
      m(target, anchor) {
        if (switch_instance)
          mount_component(switch_instance, target, anchor);
        insert(target, switch_instance_anchor, anchor);
        current = true;
      },
      p(ctx2, dirty) {
        if (dirty & /*Route*/
        1 && switch_value !== (switch_value = /*Route*/
        ctx2[0])) {
          if (switch_instance) {
            group_outros();
            const old_component = switch_instance;
            transition_out(old_component.$$.fragment, 1, 0, () => {
              destroy_component(old_component, 1);
            });
            check_outros();
          }
          if (switch_value) {
            switch_instance = construct_svelte_component(switch_value, switch_props(ctx2, dirty));
            create_component(switch_instance.$$.fragment);
            transition_in(switch_instance.$$.fragment, 1);
            mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
          } else {
            switch_instance = null;
          }
        } else if (switch_value) {
        }
      },
      i(local) {
        if (current)
          return;
        if (switch_instance)
          transition_in(switch_instance.$$.fragment, local);
        current = true;
      },
      o(local) {
        if (switch_instance)
          transition_out(switch_instance.$$.fragment, local);
        current = false;
      },
      d(detaching) {
        if (detaching) {
          detach(switch_instance_anchor);
        }
        if (switch_instance)
          destroy_component(switch_instance, detaching);
      }
    };
  }
  function create_fragment6(ctx) {
    let nav;
    let t;
    let main;
    let current_block_type_index;
    let if_block;
    let current;
    nav = new Nav_default({ props: { active: (
      /*active*/
      ctx[2]
    ) } });
    const if_block_creators = [create_if_block3, create_else_block];
    const if_blocks = [];
    function select_block_type(ctx2, dirty) {
      if (!/*params*/
      ctx2[1])
        return 0;
      return 1;
    }
    current_block_type_index = select_block_type(ctx, -1);
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    return {
      c() {
        create_component(nav.$$.fragment);
        t = space();
        main = element("main");
        if_block.c();
        attr(main, "class", "svelte-1z13hn1");
      },
      m(target, anchor) {
        mount_component(nav, target, anchor);
        insert(target, t, anchor);
        insert(target, main, anchor);
        if_blocks[current_block_type_index].m(main, null);
        current = true;
      },
      p(ctx2, [dirty]) {
        const nav_changes = {};
        if (dirty & /*active*/
        4)
          nav_changes.active = /*active*/
          ctx2[2];
        nav.$set(nav_changes);
        let previous_block_index = current_block_type_index;
        current_block_type_index = select_block_type(ctx2, dirty);
        if (current_block_type_index === previous_block_index) {
          if_blocks[current_block_type_index].p(ctx2, dirty);
        } else {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
          if_block = if_blocks[current_block_type_index];
          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
            if_block.c();
          } else {
            if_block.p(ctx2, dirty);
          }
          transition_in(if_block, 1);
          if_block.m(main, null);
        }
      },
      i(local) {
        if (current)
          return;
        transition_in(nav.$$.fragment, local);
        transition_in(if_block);
        current = true;
      },
      o(local) {
        transition_out(nav.$$.fragment, local);
        transition_out(if_block);
        current = false;
      },
      d(detaching) {
        if (detaching) {
          detach(t);
          detach(main);
        }
        destroy_component(nav, detaching);
        if_blocks[current_block_type_index].d();
      }
    };
  }
  function instance4($$self, $$props, $$invalidate) {
    let Route, params, active;
    let uri = location.pathname;
    function run2(thunk, obj) {
      $$invalidate(0, Route = thunk);
      $$invalidate(1, params = obj);
      window.scrollTo(0, 0);
    }
    function track(obj) {
      $$invalidate(3, uri = obj.state || obj.uri || location.pathname);
    }
    addEventListener("replacestate", track);
    addEventListener("pushstate", track);
    addEventListener("popstate", track);
    const router = Navaid("/").on("/", () => run2(Home_default)).on("/about", () => run2(About_default)).on("/blog", () => run2(Blog_default)).on("/blog/:postid", (obj) => run2(Article_default, obj)).listen();
    onDestroy(router.destroy);
    $$self.$$.update = () => {
      if ($$self.$$.dirty & /*uri*/
      8) {
        $:
          $$invalidate(2, active = uri.split("/")[1] || "home");
      }
    };
    return [Route, params, active, uri];
  }
  var App = class extends SvelteComponent {
    constructor(options) {
      super();
      init(this, options, instance4, create_fragment6, safe_not_equal, {});
    }
  };
  var App_default = App;

  // src/main.js
  var app = new App_default({
    target: document.body
  });
  var main_default = app;
})();
