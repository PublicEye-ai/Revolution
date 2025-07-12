var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugin.js
var plugin_exports = {};
__export(plugin_exports, {
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_obsidian3 = require("obsidian");

// node_modules/smart-environment/components/settings.js
async function build_html(env, opts = {}) {
  const env_settings_html = Object.entries(env.settings_config).map(([setting_key, setting_config]) => {
    if (!setting_config.setting) setting_config.setting = setting_key;
    return this.render_setting_html(setting_config);
  }).join("\n");
  const env_collections_containers_html = Object.entries(env.collections).map(([collection_key, collection]) => {
    return `<div data-smart-settings="${collection_key}"></div>`;
  }).join("\n");
  const html = `
    <div class="">
      ${env_settings_html}
      ${env_collections_containers_html}
    </div>
  `;
  return html;
}
async function render(env, opts = {}) {
  const html = await build_html.call(this, env, opts);
  const frag = this.create_doc_fragment(html);
  return await post_process.call(this, env, frag, opts);
}
async function post_process(env, frag, opts = {}) {
  await this.render_setting_components(frag, { scope: env });
  const env_collections_containers = frag.querySelectorAll("[data-smart-settings]");
  for (const env_collections_container of env_collections_containers) {
    const collection_key = env_collections_container.dataset.smartSettings;
    const collection = env[collection_key];
    await collection.render_settings(env_collections_container);
  }
  return frag;
}

// node_modules/smart-environment/node_modules/smart-settings/smart_settings.js
var SmartSettings = class {
  /**
   * Creates an instance of SmartEnvSettings.
   * @param {Object} main - The main object to contain the instance (smart_settings) and getter (settings)
   * @param {Object} [opts={}] - Configuration options.
   */
  constructor(main, opts = {}) {
    this.main = main;
    this.opts = opts;
    this._fs = null;
    this._settings = {};
    this._saved = false;
    this.save_timeout = null;
  }
  static async create(main, opts = {}) {
    const smart_settings = new this(main, opts);
    await smart_settings.load();
    main.smart_settings = smart_settings;
    Object.defineProperty(main, "settings", {
      get() {
        return smart_settings.settings;
      },
      set(settings) {
        smart_settings.settings = settings;
      }
    });
    return smart_settings;
  }
  static create_sync(main, opts = {}) {
    const smart_settings = new this(main, opts);
    smart_settings.load_sync();
    main.smart_settings = smart_settings;
    Object.defineProperty(main, "settings", {
      get() {
        return smart_settings.settings;
      },
      set(settings) {
        smart_settings.settings = settings;
      }
    });
    return smart_settings;
  }
  /**
   * Gets the current settings, wrapped with an observer to handle changes.
   * @returns {Proxy} A proxy object that observes changes to the settings.
   */
  get settings() {
    return observe_object(this._settings, (property, value, target) => {
      if (this.save_timeout) clearTimeout(this.save_timeout);
      this.save_timeout = setTimeout(() => {
        this.save(this._settings);
        this.save_timeout = null;
      }, 1e3);
    });
  }
  /**
   * Sets the current settings.
   * @param {Object} settings - The new settings to apply.
   */
  set settings(settings) {
    this._settings = settings;
  }
  async save(settings = this._settings) {
    if (typeof this.opts.save === "function") await this.opts.save(settings);
    else await this.main.save_settings(settings);
  }
  async load() {
    if (typeof this.opts.load === "function") this._settings = await this.opts.load();
    else this._settings = await this.main.load_settings();
  }
  load_sync() {
    if (typeof this.opts.load === "function") this._settings = this.opts.load();
    else this._settings = this.main.load_settings();
  }
};
function observe_object(obj, on_change) {
  function create_proxy(target) {
    return new Proxy(target, {
      set(target2, property, value) {
        if (target2[property] !== value) {
          target2[property] = value;
          on_change(property, value, target2);
        }
        if (typeof value === "object" && value !== null) {
          target2[property] = create_proxy(value);
        }
        return true;
      },
      get(target2, property) {
        const result = target2[property];
        if (typeof result === "object" && result !== null) {
          return create_proxy(result);
        }
        return result;
      },
      deleteProperty(target2, property) {
        if (property in target2) {
          delete target2[property];
          on_change(property, void 0, target2);
        }
        return true;
      }
    });
  }
  return create_proxy(obj);
}

// node_modules/smart-environment/utils/is_plain_object.js
function is_plain_object(o) {
  if (o === null) return false;
  if (typeof o !== "object") return false;
  if (Array.isArray(o)) return false;
  if (o instanceof Function) return false;
  if (o instanceof Date) return false;
  return Object.getPrototypeOf(o) === Object.prototype;
}

// node_modules/smart-environment/utils/deep_merge.js
function deep_merge(target, source) {
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (is_plain_object(source[key]) && is_plain_object(target[key])) {
      deep_merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// node_modules/smart-environment/utils/camel_case_to_snake_case.js
function camel_case_to_snake_case(str) {
  const result = str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, "").replace(/2$/, "");
  return result;
}

// node_modules/smart-environment/utils/normalize_opts.js
function normalize_opts(opts) {
  if (!opts.collections) opts.collections = {};
  if (!opts.modules) opts.modules = {};
  if (!opts.items) opts.items = {};
  Object.entries(opts.collections).forEach(([key, val]) => {
    if (typeof val === "function") {
      opts.collections[key] = { class: val };
    }
    const new_key = camel_case_to_snake_case(key);
    if (new_key !== key) {
      opts.collections[new_key] = opts.collections[key];
      delete opts.collections[key];
    }
    if (!opts.collections[new_key].collection_key) opts.collections[new_key].collection_key = new_key;
    if (val.item_type) {
      opts.items[camel_case_to_snake_case(val.item_type.name)] = {
        class: val.item_type
      };
    }
  });
  Object.entries(opts.modules).forEach(([key, val]) => {
    if (typeof val === "function") {
      opts.modules[key] = { class: val };
    }
    const new_key = camel_case_to_snake_case(key);
    if (new_key !== key) {
      opts.modules[new_key] = opts.modules[key];
      delete opts.modules[key];
    }
  });
  if (!opts.item_types) opts.item_types = {};
  if (!opts.items) opts.items = {};
  Object.entries(opts.item_types).forEach(([key, val]) => {
    if (typeof val === "function") {
      const new_key = camel_case_to_snake_case(key);
      opts.items[new_key] = {
        class: val,
        actions: {},
        ...opts.items[new_key] || {}
      };
    }
  });
  return opts;
}

// node_modules/smart-environment/utils/deep_clone_config.js
function is_plain_object2(value) {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function deep_clone_config(input) {
  if (Array.isArray(input)) {
    return input.map((item) => deep_clone_config(item));
  }
  if (is_plain_object2(input)) {
    const output = {};
    for (const [k, v] of Object.entries(input)) {
      output[k] = deep_clone_config(v);
    }
    return output;
  }
  return input;
}

// node_modules/smart-environment/utils/deep_merge_no_overwrite.js
function deep_merge_no_overwrite(target, source, path = []) {
  if (!is_plain_object(target) || !is_plain_object(source)) {
    return target;
  }
  if (path.includes(source)) {
    return target;
  }
  path.push(source);
  for (const key of Object.keys(source)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    const val = source[key];
    if (Array.isArray(target[key]) && Array.isArray(val)) {
      target[key].push(...val);
    } else if (is_plain_object(val)) {
      if (!is_plain_object(target[key])) {
        target[key] = {};
      }
      deep_merge_no_overwrite(target[key], val, [...path]);
    } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = val;
    }
  }
  return target;
}

// node_modules/smart-environment/utils/merge_env_config.js
function merge_env_config(target, incoming) {
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        target[key] = [...target[key] || [], ...value];
      } else {
        if (!target[key]) target[key] = {};
        deep_merge_no_overwrite(target[key], value);
      }
    } else if (value !== target[key]) {
      if (target[key] !== void 0) {
        console.warn(
          `SmartEnv: Overwriting existing property ${key} in smart_env_config`,
          { old: target[key], new: value }
        );
      }
      target[key] = value;
    }
  }
  return target;
}

// node_modules/smart-environment/smart_env.js
var SmartEnv = class {
  /**
   * @type {number} version - Bump this number when shipping a new version of SmartEnv.
   * If a newer version is loaded into a runtime that already has an older environment,
   * an automatic reload of all existing mains will occur.
   */
  static version = 2.1391095;
  scope_name = "smart_env";
  static global_ref = get_global_ref();
  global_ref = this.constructor.global_ref;
  constructor(opts = {}) {
    this.state = "init";
    this._components = {};
    this.collections = {};
    this.load_timeout = null;
    if (opts.primary_main_key) this.primary_main_key = opts.primary_main_key;
  }
  /**
   * Returns the config object for the SmartEnv instance.
   * @returns {Object} The config object.
   */
  get config() {
    if (!this._config) {
      this._config = {};
      const sorted_configs = Object.entries(this.smart_env_configs).sort(([main_key, { main, opts }]) => {
        if (!this.primary_main_key) return 0;
        if (main_key === this.primary_main_key) return -1;
        return 0;
      });
      for (const [main_key, { main, opts }] of sorted_configs) {
        if (!main) {
          console.warn(`SmartEnv: '${main_key}' has been unloaded, skipping inclusion in smart_env`);
          delete this.smart_env_configs[main_key];
          continue;
        }
        merge_env_config(
          this._config,
          deep_clone_config(
            normalize_opts(opts)
          )
        );
      }
    }
    return this._config;
  }
  get env_start_wait_time() {
    if (typeof this.config.env_start_wait_time === "number") return this.config.env_start_wait_time;
    return 5e3;
  }
  static get global_env() {
    return this.global_ref.smart_env;
  }
  static set global_env(env) {
    this.global_ref.smart_env = env;
  }
  static get mains() {
    return Object.keys(this.global_ref.smart_env_configs || {});
  }
  get mains() {
    return Object.keys(this.global_ref.smart_env_configs || {});
  }
  static get should_reload() {
    if (!this.global_env) return true;
    if (this.global_env.state === "loaded") return true;
    if (typeof this.global_env?.constructor?.version === "undefined") return true;
    if (this.global_env.constructor.version < this.version) {
      console.warn(
        "SmartEnv: Reloading environment because of version mismatch",
        `${this.version} > ${this.global_env.constructor.version}`
      );
      return true;
    }
    return false;
  }
  static get smart_env_configs() {
    if (!this.global_ref.smart_env_configs) this.global_ref.smart_env_configs = {};
    return this.global_ref.smart_env_configs;
  }
  get smart_env_configs() {
    if (!this.global_ref.smart_env_configs) this.global_ref.smart_env_configs = {};
    return this.global_ref.smart_env_configs;
  }
  /**
   * Waits for either a specific main to be registered in the environment,
   * or (if `opts.main` is not specified) waits for environment collections to load.
   * @param {object} opts
   * @param {object} [opts.main] - if set, the function waits until that main is found.
   * @returns {Promise<SmartEnv>} Resolves with the environment instance
   */
  static wait_for(opts = {}) {
    return new Promise((resolve) => {
      if (opts.main) {
        const interval2 = setInterval(() => {
          if (this.global_env && this.global_env[opts.main]) {
            clearInterval(interval2);
            resolve(this.global_env);
          }
        }, 1e3);
      } else {
        const interval2 = setInterval(() => {
          if (this.global_env && this.global_env.state === "loaded") {
            clearInterval(interval2);
            resolve(this.global_env);
          }
        }, 100);
      }
    });
  }
  /**
   * Creates or updates a SmartEnv instance.
   * - If a global environment exists and is an older version or lacks 'init_main', it is replaced.
   * @param {Object} main - The main object to be added to the SmartEnv instance.
   * @param {Object} [main_env_opts={}] - Options for configuring the SmartEnv instance.
   * @returns {SmartEnv} The SmartEnv instance.
   * @throws {TypeError} If an invalid main object is provided.
   * @throws {Error} If there's an error creating or updating the SmartEnv instance.
   */
  static async create(main, main_env_opts = null) {
    if (!main || typeof main !== "object") {
      throw new TypeError("SmartEnv: Invalid main object provided");
    }
    if (!main_env_opts) {
      if (!main.smart_env_config) {
        throw new Error("SmartEnv: No main_env_opts or main.smart_env_config provided");
      }
      main_env_opts = main.smart_env_config;
    }
    this.add_main(main, main_env_opts);
    if (this.should_reload) {
      const opts = {};
      if (this.global_env && this.version > (this.global_env.constructor?.version || 0)) {
        opts.primary_main_key = camel_case_to_snake_case(main.constructor.name);
      }
      if (this.global_env?.load_timeout) clearTimeout(this.global_env.load_timeout);
      this.global_env = new this(opts);
      if (!window.all_envs) window.all_envs = [];
      window.all_envs.push(this.global_env);
    }
    clearTimeout(this.global_env.load_timeout);
    this.global_env.load_timeout = setTimeout(async () => {
      await this.global_env.load();
      this.global_env.load_timeout = null;
    }, this.global_env.env_start_wait_time);
    return this.global_env;
  }
  static add_main(main, main_env_opts = null) {
    if (this.global_env?._config) this.global_env._config = null;
    const main_key = camel_case_to_snake_case(main.constructor.name);
    this.smart_env_configs[main_key] = { main, opts: main_env_opts };
    this.create_env_getter(main);
  }
  /**
   * Creates a dynamic environment getter on any instance object.
   * The returned 'env' property will yield the global `smart_env`.
   * @param {Object} instance_to_receive_getter
   */
  static create_env_getter(instance_to_receive_getter) {
    Object.defineProperty(instance_to_receive_getter, "env", {
      get: () => this.global_env
    });
  }
  create_env_getter(instance_to_receive_getter) {
    this.constructor.create_env_getter(instance_to_receive_getter);
  }
  async load() {
    await this.fs.load_files();
    if (!this.settings) await SmartSettings.create(this);
    if (this.config.default_settings) {
      deep_merge_no_overwrite(this.settings, this.config.default_settings);
    }
    await this.init_collections();
    for (const [main_key, { main, opts }] of Object.entries(this.smart_env_configs)) {
      this[main_key] = main;
      await this.ready_to_load_collections(main);
    }
    await this.load_collections();
    this.state = "loaded";
  }
  /**
   * Initializes collection classes if they have an 'init' function.
   * @param {Object} [config=this.config]
   */
  async init_collections(config = this.config) {
    for (const key of Object.keys(config.collections || {})) {
      const _class = config.collections[key]?.class;
      if (!_class) continue;
      if (_class.default_settings) {
        deep_merge_no_overwrite(
          this.settings,
          {
            [key]: _class.default_settings
          }
        );
      }
      if (typeof _class.init !== "function") continue;
      await _class.init(this, { ...config.collections[key] });
      this.collections[key] = "init";
    }
  }
  /**
   * Hook for main classes that optionally implement `ready_to_load_collections()`.
   * @param {Object} main
   */
  async ready_to_load_collections(main) {
    if (typeof main?.ready_to_load_collections === "function") {
      await main.ready_to_load_collections();
    }
    return true;
  }
  /**
   * Loads any available collections, processing their load queues.
   * @param {Object} [collections=this.collections] - Key-value map of collection instances.
   */
  async load_collections(collections = this.collections) {
    for (const key of Object.keys(collections || {})) {
      const time_start = Date.now();
      if (typeof this[key]?.process_load_queue === "function") {
        if (this.state === "init" && this[key].opts?.prevent_load_on_init === true) continue;
        await this[key].process_load_queue();
      }
      this.collections[key] = "loaded";
      this[key].load_time_ms = Date.now() - time_start;
    }
  }
  /**
   * Removes a main from the window.smart_env_configs to exclude it on reload
   * @param {Class} main
   * @param {Object|null} [unload_config=null]
   */
  static unload_main(main) {
    const main_key = camel_case_to_snake_case(main.constructor.name);
    this.smart_env_configs[main_key] = null;
    delete this.smart_env_configs[main_key];
  }
  unload_main(main) {
    this.constructor.unload_main(main);
  }
  /**
   * Triggers a save event in all known collections.
   */
  save() {
    for (const key of Object.keys(this.collections)) {
      this[key].process_save_queue?.();
    }
  }
  /**
   * Initialize a module from the configured `this.opts.modules`.
   * @param {string} module_key
   * @param {object} opts
   * @returns {object|null} instance of the requested module or null if not found
   */
  init_module(module_key, opts = {}) {
    const module_config = this.opts.modules[module_key];
    if (!module_config) {
      return console.warn(`SmartEnv: module ${module_key} not found`);
    }
    opts = {
      ...{ ...module_config, class: null },
      ...opts
    };
    return new module_config.class(opts);
  }
  get notices() {
    if (!this._notices) {
      const SmartNoticesClass = this.config.modules.smart_notices.class;
      this._notices = new SmartNoticesClass(this, {
        adapter: this.config.modules.smart_notices.adapter
      });
    }
    return this._notices;
  }
  /**
   * Exposes a settings template function from environment opts or defaults.
   * @returns {Function}
   */
  get settings_template() {
    return this.opts.components?.smart_env?.settings || render;
  }
  /**
   * Renders settings UI into a container, using the environment's `settings_template`.
   * @param {HTMLElement} [container=this.settings_container]
   */
  async render_settings(container = this.settings_container) {
    if (!this.settings_container || container !== this.settings_container) {
      this.settings_container = container;
    }
    if (!container) {
      throw new Error("Container is required");
    }
    const frag = await this.render_component("settings", this, {});
    container.innerHTML = "";
    container.appendChild(frag);
    return frag;
  }
  /**
   * Renders a named component using an optional scope and options.
   * @param {string} component_key
   * @param {Object} scope
   * @param {Object} [opts]
   * @returns {Promise<HTMLElement>}
   */
  async render_component(component_key, scope, opts = {}) {
    const component_renderer = this.get_component(component_key, scope);
    if (!component_renderer) {
      console.warn(`SmartEnv: component ${component_key} not found for scope ${scope.constructor.name}`);
      return this.smart_view.create_doc_fragment(`<div class="smart-env-component-not-found">
        <h1>Component Not Found</h1>
        <p>The component ${component_key} was not found for scope ${scope.constructor.name}.</p>
      </div>`);
    }
    const frag = await component_renderer(scope, opts);
    return frag;
  }
  /**
   * Retrieves or creates a memoized component renderer function.
   * @param {string} component_key
   * @param {Object} scope
   * @returns {Function|undefined}
   */
  get_component(component_key, scope) {
    const scope_name = scope.collection_key ?? scope.scope_name;
    const _cache_key = scope_name ? `${scope_name}-${component_key}` : component_key;
    if (!this._components[_cache_key]) {
      try {
        if (this.opts.components[scope_name]?.[component_key]) {
          this._components[_cache_key] = this.opts.components[scope_name][component_key].bind(
            this.init_module("smart_view")
          );
        } else if (this.opts.components[component_key]) {
          this._components[_cache_key] = this.opts.components[component_key].bind(
            this.init_module("smart_view")
          );
        } else {
          console.warn(
            `SmartEnv: component ${component_key} not found for scope ${scope_name}`
          );
        }
      } catch (e) {
        console.error("Error getting component", e);
        console.log(
          `scope_name: ${scope_name}; component_key: ${component_key}; this.opts.components: ${Object.keys(
            this.opts.components || {}
          ).join(", ")}; this.opts.components[scope_name]: ${Object.keys(
            this.opts.components[scope_name] || {}
          ).join(", ")}`
        );
      }
    }
    return this._components[_cache_key];
  }
  /**
   * Lazily instantiate the module 'smart_view'.
   * @returns {object}
   */
  get smart_view() {
    if (!this._smart_view) {
      this._smart_view = this.init_module("smart_view");
    }
    return this._smart_view;
  }
  /**
   * A built-in settings schema for this environment.
   * @returns {Object}
   */
  get settings_config() {
    return {
      is_obsidian_vault: {
        name: "Obsidian Vault",
        description: "Toggle on if this is an Obsidian vault.",
        type: "toggle",
        default: false
      },
      file_exclusions: {
        name: "File Exclusions",
        description: "Comma-separated list of files to exclude.",
        type: "text",
        default: "",
        callback: "update_exclusions"
      },
      folder_exclusions: {
        name: "Folder Exclusions",
        description: "Comma-separated list of folders to exclude.",
        type: "text",
        default: "",
        callback: "update_exclusions"
      },
      excluded_headings: {
        name: "Excluded Headings",
        description: "Comma-separated list of headings to exclude. Note: currently only applies to blocks (2025-04-07).",
        type: "text",
        default: ""
      }
    };
  }
  get global_prop() {
    return this.opts.global_prop ?? "smart_env";
  }
  get item_types() {
    return this.opts.item_types;
  }
  get fs_module_config() {
    return this.opts.modules.smart_fs;
  }
  get fs() {
    if (!this.smart_fs) {
      this.smart_fs = new this.fs_module_config.class(this, {
        adapter: this.fs_module_config.adapter,
        fs_path: this.opts.env_path || ""
      });
    }
    return this.smart_fs;
  }
  get env_data_dir() {
    const env_settings_files = this.fs.file_paths?.filter((path) => path.endsWith("smart_env.json")) || [];
    let env_data_dir = ".smart-env";
    if (env_settings_files.length > 0) {
      if (env_settings_files.length > 1) {
        const env_data_dir_counts = env_settings_files.map((path) => {
          const dir = path.split("/").slice(-2, -1)[0];
          return {
            dir,
            count: this.fs.file_paths.filter((p) => p.includes(dir)).length
          };
        });
        env_data_dir = env_data_dir_counts.reduce(
          (max3, dirObj) => dirObj.count > max3.count ? dirObj : max3,
          env_data_dir_counts[0]
        ).dir;
      } else {
        env_data_dir = env_settings_files[0].split("/").slice(-2, -1)[0];
      }
    }
    return env_data_dir;
  }
  get data_fs() {
    if (!this._fs) {
      this._fs = new this.fs_module_config.class(this, {
        adapter: this.fs_module_config.adapter,
        fs_path: this.data_fs_path
      });
    }
    return this._fs;
  }
  get data_fs_path() {
    if (!this._data_fs_path) {
      this._data_fs_path = (this.opts.env_path + (this.opts.env_path ? this.opts.env_path.includes("\\") ? "\\" : "/" : "") + this.env_data_dir).replace(/\\\\/g, "\\").replace(/\/\//g, "/");
    }
    return this._data_fs_path;
  }
  /**
   * Saves the current settings to the file system.
   * @param {Object|null} [settings=null] - Optional settings to override the current settings before saving.
   * @returns {Promise<void>}
   */
  async save_settings(settings) {
    this._saved = false;
    if (!await this.data_fs.exists("")) {
      await this.data_fs.mkdir("");
    }
    await this.data_fs.write("smart_env.json", JSON.stringify(settings, null, 2));
    this._saved = true;
  }
  /**
   * Loads settings from the file system, merging with any `default_settings` or `smart_env_settings`.
   * @returns {Promise<Object>} the loaded settings
   */
  async load_settings() {
    if (!await this.data_fs.exists("smart_env.json")) await this.save_settings({});
    let settings = JSON.parse(JSON.stringify(this.config.default_settings || {}));
    deep_merge(settings, JSON.parse(await this.data_fs.read("smart_env.json")));
    deep_merge(settings, this.opts?.smart_env_settings || {});
    this._saved = true;
    if (this.fs.auto_excluded_files) {
      const existing_file_exclusions = settings.file_exclusions.split(",").map((s) => s.trim()).filter(Boolean);
      settings.file_exclusions = [...existing_file_exclusions, ...this.fs.auto_excluded_files].filter((value, index2, self) => self.indexOf(value) === index2).join(",");
    }
    return settings;
  }
  /**
   * Refreshes file-system state if exclusions changed,
   * then re-renders relevant settings UI
   */
  async update_exclusions() {
    this.smart_sources._fs = null;
    await this.smart_sources.fs.init();
  }
  // DEPRECATED
  /** @deprecated access `this.state` and `collection.state` directly instead */
  get collections_loaded() {
    return this.state === "loaded";
  }
  /** @deprecated Use this['main_class_name'] instead of this.main/this.plugin */
  get main() {
    return this.smart_env_configs[this.mains[0]]?.main;
  }
  /**
   * @deprecated use component pattern instead
   */
  get ejs() {
    return this.opts.ejs;
  }
  /**
   * @deprecated use component pattern instead
   */
  get templates() {
    return this.opts.templates;
  }
  /**
   * @deprecated use component pattern instead
   */
  get views() {
    return this.opts.views;
  }
  /**
   * @deprecated use this.config instead
   */
  get opts() {
    return this.config;
  }
  /**
   * @deprecated Use this.main_class_name instead of this.plugin
   */
  get plugin() {
    return this.main;
  }
};
function get_global_ref() {
  if (typeof document !== "undefined" && document.window) {
    console.log("using document.window");
    return document.window;
  }
  if (typeof window !== "undefined") {
    console.log("using window");
    return window;
  }
  if (typeof global?.window !== "undefined") {
    console.log("using global.window");
    return global.window;
  }
  console.log("using global");
  return global;
}

// ../jsbrains/smart-collections/adapters/_adapter.js
var CollectionDataAdapter = class {
  /**
   * @constructor
   * @param {Object} collection - The collection instance that this adapter manages.
   */
  constructor(collection) {
    this.collection = collection;
    this.env = collection.env;
  }
  /**
   * The class to use for item adapters.
   * @type {typeof ItemDataAdapter}
   */
  ItemDataAdapter = ItemDataAdapter;
  /**
   * Optional factory method to create item adapters.
   * If `this.item_adapter_class` is not null, it uses that; otherwise can be overridden by subclasses.
   * @param {Object} item - The item to create an adapter for.
   * @returns {ItemDataAdapter}
   */
  create_item_adapter(item) {
    if (!this.ItemDataAdapter) {
      throw new Error("No item_adapter_class specified and create_item_adapter not overridden.");
    }
    return new this.ItemDataAdapter(item);
  }
  /**
   * Load a single item by its key using an `ItemDataAdapter`.
   * @async
   * @param {string} key - The key of the item to load.
   * @returns {Promise<void>} Resolves when the item is loaded.
   */
  async load_item(key) {
    throw new Error("Not implemented");
  }
  /**
   * Save a single item by its key using its associated `ItemDataAdapter`.
   * @async
   * @param {string} key - The key of the item to save.
   * @returns {Promise<void>} Resolves when the item is saved.
   */
  async save_item(key) {
    throw new Error("Not implemented");
  }
  /**
   * Delete a single item by its key. This may involve updating or removing its file,
   * as handled by the `ItemDataAdapter`.
   * @async
   * @param {string} key - The key of the item to delete.
   * @returns {Promise<void>} Resolves when the item is deleted.
   */
  async delete_item(key) {
    throw new Error("Not implemented");
  }
  /**
   * Process any queued load operations. Typically orchestrates calling `load_item()` 
   * on items that have been flagged for loading.
   * @async
   * @returns {Promise<void>}
   */
  async process_load_queue() {
    throw new Error("Not implemented");
  }
  /**
   * Process any queued save operations. Typically orchestrates calling `save_item()` 
   * on items that have been flagged for saving.
   * @async
   * @returns {Promise<void>}
   */
  async process_save_queue() {
    throw new Error("Not implemented");
  }
  /**
   * Load the item's data from storage if it has been updated externally.
   * @async
   * @param {string} key - The key of the item to load.
   * @returns {Promise<void>} Resolves when the item is loaded.
   */
  async load_item_if_updated(item) {
    const adapter = this.create_item_adapter(item);
    await adapter.load_if_updated();
  }
};
var ItemDataAdapter = class {
  /**
   * @constructor
   * @param {Object} item - The collection item instance that this adapter manages.
   */
  constructor(item) {
    this.item = item;
  }
  /**
   * Load the item's data from storage. May involve reading a file and parsing 
   * its contents, then updating `item.data`.
   * @async
   * @returns {Promise<void>} Resolves when the item is fully loaded.
   */
  async load() {
    throw new Error("Not implemented");
  }
  /**
   * Save the item's data to storage. May involve writing to a file or appending 
   * lines in an append-only format.
   * @async
   * @param {string|null} [ajson=null] - An optional serialized representation of the item’s data.
   *                                     If not provided, the adapter should derive it from the item.
   * @returns {Promise<void>} Resolves when the item is saved.
   */
  async save(ajson = null) {
    throw new Error("Not implemented");
  }
  /**
   * Delete the item's data from storage. May involve removing a file or writing 
   * a `null` entry in an append-only file to signify deletion.
   * @async
   * @returns {Promise<void>} Resolves when the item’s data is deleted.
   */
  async delete() {
    throw new Error("Not implemented");
  }
  /**
   * Returns the file path or unique identifier used by this adapter to locate and store 
   * the item's data. This may be a file name derived from the item's key.
   * @returns {string} The path or identifier for the item's data.
   */
  get data_path() {
    throw new Error("Not implemented");
  }
  /**
   * @returns {CollectionDataAdapter} The collection data adapter that this item data adapter belongs to.
   */
  get collection_adapter() {
    return this.item.collection.data_adapter;
  }
  get env() {
    return this.item.env;
  }
  /**
   * Load the item's data from storage if it has been updated externally.
   * @async
   * @returns {Promise<void>} Resolves when the item is loaded.
   */
  async load_if_updated() {
    throw new Error("Not implemented");
  }
};

// ../jsbrains/smart-collections/adapters/_file.js
var FileCollectionDataAdapter = class extends CollectionDataAdapter {
  /**
   * The class to use for item adapters.
   * @type {typeof ItemDataAdapter}
   */
  ItemDataAdapter = FileItemDataAdapter;
  /**
   * @returns {Object} Filesystem interface derived from environment or collection settings.
   */
  get fs() {
    return this.collection.data_fs || this.collection.env.data_fs;
  }
};
var FileItemDataAdapter = class extends ItemDataAdapter {
  /**
   * @returns {Object} Filesystem interface derived from environment or collection settings.
   */
  get fs() {
    return this.item.collection.data_fs || this.item.collection.env.data_fs;
  }
  get data_path() {
    throw new Error("Not implemented");
  }
  async load_if_updated() {
    const data_path = this.data_path;
    if (await this.fs.exists(data_path)) {
      const loaded_at = this.item.loaded_at || 0;
      const data_file_stat = await this.fs.stat(data_path);
      if (data_file_stat.mtime > loaded_at + 1 * 60 * 1e3) {
        console.log(`Smart Collections: Re-loading item ${this.item.key} because it has been updated on disk`);
        await this.load();
      }
    }
  }
};

// ../jsbrains/smart-collections/adapters/ajson_multi_file.js
var class_to_collection_key = {
  "SmartSource": "smart_sources",
  "SmartNote": "smart_sources",
  // DEPRECATED
  "SmartBlock": "smart_blocks",
  "SmartDirectory": "smart_directories"
};
var AjsonMultiFileCollectionDataAdapter = class extends FileCollectionDataAdapter {
  /**
   * The class to use for item adapters.
   * @type {typeof ItemDataAdapter}
   */
  ItemDataAdapter = AjsonMultiFileItemDataAdapter;
  /**
   * Load a single item by its key.
   * @async
   * @param {string} key
   * @returns {Promise<void>}
   */
  async load_item(key) {
    const item = this.collection.get(key);
    if (!item) return;
    const adapter = this.create_item_adapter(item);
    await adapter.load();
  }
  /**
   * Save a single item by its key.
   * @async
   * @param {string} key
   * @returns {Promise<void>}
   */
  async save_item(key) {
    const item = this.collection.get(key);
    if (!item) return;
    const adapter = this.create_item_adapter(item);
    await adapter.save();
  }
  /**
   * Process any queued load operations.
   * @async
   * @returns {Promise<void>}
   */
  async process_load_queue() {
    this.collection.show_process_notice("loading_collection");
    if (!await this.fs.exists(this.collection.data_dir)) {
      await this.fs.mkdir(this.collection.data_dir);
    }
    const load_queue = Object.values(this.collection.items).filter((item) => item._queue_load);
    if (!load_queue.length) {
      this.collection.clear_process_notice("loading_collection");
      return;
    }
    console.log(`Loading ${this.collection.collection_key}: ${load_queue.length} items`);
    const batch_size = 100;
    for (let i = 0; i < load_queue.length; i += batch_size) {
      const batch = load_queue.slice(i, i + batch_size);
      await Promise.all(batch.map((item) => {
        const adapter = this.create_item_adapter(item);
        return adapter.load().catch((err) => {
          console.warn(`Error loading item ${item.key}`, err);
          item.queue_load();
        });
      }));
    }
    console.log(`Loaded ${this.collection.collection_key} in ${this.collection.load_time_ms}ms`);
    this.collection.loaded = load_queue.length;
    this.collection.clear_process_notice("loading_collection");
  }
  /**
   * Process any queued save operations.
   * @async
   * @returns {Promise<void>}
   */
  async process_save_queue() {
    this.collection.show_process_notice("saving_collection");
    const save_queue = Object.values(this.collection.items).filter((item) => item._queue_save);
    console.log(`Saving ${this.collection.collection_key}: ${save_queue.length} items`);
    const time_start = Date.now();
    const batch_size = 50;
    for (let i = 0; i < save_queue.length; i += batch_size) {
      const batch = save_queue.slice(i, i + batch_size);
      await Promise.all(batch.map((item) => {
        const adapter = this.create_item_adapter(item);
        return adapter.save().catch((err) => {
          console.warn(`Error saving item ${item.key}`, err);
          item.queue_save();
        });
      }));
    }
    const deleted_items = Object.values(this.collection.items).filter((item) => item.deleted);
    if (deleted_items.length) {
      deleted_items.forEach((item) => {
        delete this.collection.items[item.key];
      });
    }
    console.log(`Saved ${this.collection.collection_key} in ${Date.now() - time_start}ms`);
    this.collection.clear_process_notice("saving_collection");
  }
  get_item_data_path(key) {
    return [
      this.collection.data_dir || "multi",
      this.fs?.sep || "/",
      this.get_data_file_name(key) + ".ajson"
    ].join("");
  }
  /**
   * Transforms the item key into a safe filename.
   * Replaces spaces, slashes, and dots with underscores.
   * @returns {string} safe file name
   */
  get_data_file_name(key) {
    return key.split("#")[0].replace(/[\s\/\.]/g, "_").replace(".md", "");
  }
  /**
   * Build a single AJSON line for the given item and data.
   * @param {Object} item 
   * @returns {string}
   */
  get_item_ajson(item) {
    const collection_key = item.collection_key;
    const key = item.key;
    const data_value = item.deleted ? "null" : JSON.stringify(item.data);
    return `${JSON.stringify(`${collection_key}:${key}`)}: ${data_value},`;
  }
};
var AjsonMultiFileItemDataAdapter = class extends FileItemDataAdapter {
  /**
   * Derives the `.ajson` file path from the collection's data_dir and item key.
   * @returns {string}
   */
  get data_path() {
    return this.collection_adapter.get_item_data_path(this.item.key);
  }
  /**
   * Load the item from its `.ajson` file.
   * @async
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const raw_data = await this.fs.adapter.read(this.data_path, "utf-8", { no_cache: true });
      if (!raw_data) {
        this.item.queue_import();
        return;
      }
      const { rewrite, file_data } = this._parse(raw_data);
      if (rewrite) {
        if (file_data.length) await this.fs.write(this.data_path, file_data);
        else await this.fs.remove(this.data_path);
      }
      const last_import_mtime = this.item.data.last_import?.at || 0;
      if (last_import_mtime && this.item.init_file_mtime > last_import_mtime) {
        this.item.queue_import();
      }
    } catch (e) {
      this.item.queue_import();
    }
  }
  /**
   * Parse the entire AJSON content as a JSON object, handle legacy keys, and extract final state.
   * @private
   * @param {string} ajson 
   * @returns {boolean}
   */
  _parse(ajson) {
    try {
      let rewrite = false;
      if (!ajson.length) return false;
      ajson = ajson.trim();
      const original_line_count = ajson.split("\n").length;
      const json_str = "{" + ajson.slice(0, -1) + "}";
      const data = JSON.parse(json_str);
      const entries = Object.entries(data);
      for (let i = 0; i < entries.length; i++) {
        const [ajson_key, value] = entries[i];
        if (!value) {
          delete data[ajson_key];
          rewrite = true;
          continue;
        }
        const { collection_key, item_key, changed } = this._parse_ajson_key(ajson_key);
        if (changed) {
          rewrite = true;
          data[collection_key + ":" + item_key] = value;
          delete data[ajson_key];
        }
        const collection = this.env[collection_key];
        if (!collection) continue;
        const existing_item = collection.get(item_key);
        if (!value.key) value.key = item_key;
        if (existing_item) {
          existing_item.data = value;
          existing_item._queue_load = false;
          existing_item.loaded_at = Date.now();
        } else {
          const ItemClass = collection.item_type;
          const new_item = new ItemClass(this.env, value);
          new_item._queue_load = false;
          new_item.loaded_at = Date.now();
          collection.set(new_item);
        }
      }
      if (rewrite || original_line_count > entries.length) {
        rewrite = true;
      }
      return {
        rewrite,
        file_data: rewrite ? Object.entries(data).map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)},`).join("\n") : null
      };
    } catch (e) {
      if (ajson.split("\n").some((line) => !line.endsWith(","))) {
        console.warn("fixing trailing comma error");
        ajson = ajson.split("\n").map((line) => line.endsWith(",") ? line : line + ",").join("\n");
        return this._parse(ajson);
      }
      console.warn("Error parsing JSON:", e);
      return { rewrite: true, file_data: null };
    }
  }
  _parse_ajson_key(ajson_key) {
    let changed;
    let [collection_key, ...item_key] = ajson_key.split(":");
    if (class_to_collection_key[collection_key]) {
      collection_key = class_to_collection_key[collection_key];
      changed = true;
    }
    return {
      collection_key,
      item_key: item_key.join(":"),
      changed
    };
  }
  /**
   * Save the current state of the item by appending a new line to its `.ajson` file.
   * @async
   * @returns {Promise<void>}
   */
  async save(retries = 0) {
    try {
      const ajson_line = this.get_item_ajson();
      await this.fs.append(this.data_path, "\n" + ajson_line);
      this.item._queue_save = false;
    } catch (e) {
      if (e.code === "ENOENT" && retries < 1) {
        const dir = this.collection_adapter.collection.data_dir;
        if (!await this.fs.exists(dir)) {
          await this.fs.mkdir(dir);
        }
        return await this.save(retries + 1);
      }
      console.warn("Error saving item", this.data_path, e);
    }
  }
  /**
   * Build a single AJSON line for the given item and data.
   * @param {Object} item 
   * @returns {string}
   */
  get_item_ajson() {
    return this.collection_adapter.get_item_ajson(this.item);
  }
};

// ../jsbrains/smart-collections/utils/ajson_merge.js
function ajson_merge(existing, new_obj) {
  if (new_obj === null) return null;
  if (new_obj === void 0) return existing;
  if (typeof new_obj !== "object") return new_obj;
  if (typeof existing !== "object" || existing === null) existing = {};
  const keys = Object.keys(new_obj);
  const length = keys.length;
  for (let i = 0; i < length; i++) {
    const key = keys[i];
    const new_val = new_obj[key];
    const existing_val = existing[key];
    if (Array.isArray(new_val)) {
      existing[key] = new_val.slice();
    } else if (is_object(new_val)) {
      existing[key] = ajson_merge(is_object(existing_val) ? existing_val : {}, new_val);
    } else if (new_val !== void 0) {
      existing[key] = new_val;
    }
  }
  return existing;
}
function is_object(obj) {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

// ../jsbrains/smart-collections/adapters/ajson_single_file.js
var class_to_collection_key2 = {
  "SmartSource": "smart_sources",
  "SmartNote": "smart_sources",
  // DEPRECATED
  "SmartBlock": "smart_blocks",
  "SmartDirectory": "smart_directories"
};
function _parse_ajson_key(ajson_key) {
  let changed = false;
  let [collection_key, ...item_key] = ajson_key.split(":");
  if (class_to_collection_key2[collection_key]) {
    collection_key = class_to_collection_key2[collection_key];
    changed = true;
  }
  return {
    collection_key,
    item_key: item_key.join(":"),
    changed
  };
}
var AjsonSingleFileCollectionDataAdapter = class extends AjsonMultiFileCollectionDataAdapter {
  /**
   * Returns the single shared `.ajson` file path for this collection.
   * @param {string} [key] - (unused) Item key, ignored in single-file mode.
   * @returns {string} The single .ajson file path for the entire collection.
   */
  get_item_data_path(key) {
    const file_name = (this.collection?.collection_key || "collection") + ".ajson";
    const sep = this.fs?.sep || "/";
    const dir = this.collection.data_dir || "data";
    return [dir, file_name].join(sep);
  }
  /**
   * Override process_load_queue to parse the entire single-file .ajson once,
   * distributing final states to items.
   *
   * @async
   * @returns {Promise<void>}
   */
  async process_load_queue() {
    this.collection.show_process_notice("loading_collection");
    if (!await this.fs.exists(this.collection.data_dir)) {
      await this.fs.mkdir(this.collection.data_dir);
    }
    const path = this.get_item_data_path();
    if (!await this.fs.exists(path)) {
      for (const item of Object.values(this.collection.items)) {
        if (item._queue_load) {
          item.queue_import?.();
        }
      }
      this.collection.clear_process_notice("loading_collection");
      return;
    }
    const raw_data = await this.fs.read(path, "utf-8", { no_cache: true });
    if (!raw_data) {
      for (const item of Object.values(this.collection.items)) {
        if (item._queue_load) {
          item.queue_import?.();
        }
      }
      this.collection.clear_process_notice("loading_collection");
      return;
    }
    const { rewrite, file_data } = this.parse_single_file_ajson(raw_data);
    if (rewrite) {
      if (file_data.length) {
        await this.fs.write(path, file_data);
      } else {
        await this.fs.remove(path);
      }
    }
    for (const item of Object.values(this.collection.items)) {
      item._queue_load = false;
      item.loaded_at = Date.now();
    }
    this.collection.clear_process_notice("loading_collection");
  }
  /**
   * Helper to parse single-file .ajson content, distributing states to items.
   *
   * @param {string} raw
   * @returns {{ rewrite: boolean, file_data: string }}
   */
  parse_single_file_ajson(raw) {
    let rewrite = false;
    const lines = raw.trim().split("\n").filter(Boolean);
    let data_map = {};
    let line_count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.endsWith(",")) {
        rewrite = true;
      }
      const trimmed = line.replace(/,$/, "");
      const combined = "{" + trimmed + "}";
      try {
        const obj = JSON.parse(combined);
        const [fullKey, value] = Object.entries(obj)[0];
        let { collection_key, item_key, changed } = _parse_ajson_key(fullKey);
        const newKey = `${collection_key}:${item_key}`;
        if (!value) {
          delete data_map[newKey];
          if (changed || newKey !== fullKey) {
            delete data_map[fullKey];
          }
          rewrite = true;
        } else {
          data_map[newKey] = value;
          if (changed || newKey !== fullKey) {
            delete data_map[fullKey];
            rewrite = true;
          }
        }
      } catch (err) {
        console.warn("parse error for line: ", line, err);
        rewrite = true;
      }
      line_count++;
    }
    for (const [ajson_key, val] of Object.entries(data_map)) {
      const [collection_key, ...rest] = ajson_key.split(":");
      const item_key = rest.join(":");
      const collection = this.collection.env[collection_key];
      if (!collection) continue;
      let item = collection.get(item_key);
      if (!item) {
        const ItemClass = collection.item_type;
        item = new ItemClass(this.env, val);
        collection.set(item);
      } else {
        item.data = ajson_merge(item.data, val);
      }
      item.loaded_at = Date.now();
      item._queue_load = false;
      if (!val.key) val.key = item_key;
    }
    if (line_count > Object.keys(data_map).length) {
      rewrite = true;
    }
    let minimal_lines = [];
    for (const [ajson_key, val] of Object.entries(data_map)) {
      minimal_lines.push(`${JSON.stringify(ajson_key)}: ${JSON.stringify(val)},`);
    }
    return {
      rewrite,
      file_data: minimal_lines.join("\n")
    };
  }
  /**
   * Override process_save_queue for single-file approach.
   * We'll simply call save_item for each queued item, which appends a line to the same `.ajson`.
   *
   * @async
   * @returns {Promise<void>}
   */
  async process_save_queue() {
    this.collection.show_process_notice("saving_collection");
    const save_queue = Object.values(this.collection.items).filter((item) => item._queue_save);
    const time_start = Date.now();
    const batch_size = 50;
    for (let i = 0; i < save_queue.length; i += batch_size) {
      const batch = save_queue.slice(i, i + batch_size);
      await Promise.all(batch.map((item) => {
        const adapter = this.create_item_adapter(item);
        return adapter.save().catch((err) => {
          console.warn(`Error saving item ${item.key}`, err);
          item.queue_save();
        });
      }));
    }
    const deleted_items = Object.values(this.collection.items).filter((item) => item.deleted);
    if (deleted_items.length) {
      deleted_items.forEach((item) => {
        delete this.collection.items[item.key];
      });
    }
    console.log(`Saved (single-file) ${this.collection.collection_key} in ${Date.now() - time_start}ms`);
    this.collection.clear_process_notice("saving_collection");
  }
};
var AjsonSingleFileItemDataAdapter = class extends AjsonMultiFileItemDataAdapter {
  /**
   * Overridden to always return the single file path from the parent collection adapter.
   * @returns {string}
   */
  get data_path() {
    return this.collection_adapter.get_item_data_path(this.item.key);
  }
  /**
   * Load logic:
   * In single-file mode, we typically rely on the collection's `process_load_queue()`
   * to parse the entire file. This direct `load()` will do a naive re-parse as well
   * if used individually.
   */
  async load() {
    const path = this.data_path;
    if (!await this.fs.exists(path)) {
      this.item.queue_import?.();
      return;
    }
    try {
      const raw_data = await this.fs.read(path, "utf-8", { no_cache: true });
      if (!raw_data) {
        this.item.queue_import?.();
        return;
      }
      const { rewrite } = this.collection_adapter.parse_single_file_ajson(raw_data);
    } catch (err) {
      console.warn(`Error loading single-file item ${this.item.key}`, err);
      this.item.queue_import?.();
    }
  }
};
var ajson_single_file_default = {
  collection: AjsonSingleFileCollectionDataAdapter,
  item: AjsonSingleFileItemDataAdapter
};

// ../jsbrains/smart-clusters/node_modules/smart-collections/utils/collection_instance_name_from.js
function collection_instance_name_from(class_name) {
  if (class_name.endsWith("Item")) {
    return class_name.replace(/Item$/, "").toLowerCase();
  }
  return class_name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/y$/, "ie") + "s";
}

// ../jsbrains/smart-clusters/node_modules/smart-collections/utils/helpers.js
function create_uid(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
    if (hash < 0) hash = hash * -1;
  }
  return hash.toString() + str.length;
}
function deep_merge2(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (is_obj(source[key]) && is_obj(target[key])) deep_merge2(target[key], source[key]);
      else target[key] = source[key];
    }
  }
  return target;
  function is_obj(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}

// ../jsbrains/smart-clusters/node_modules/smart-collections/utils/deep_equal.js
function deep_equal(obj1, obj2, visited = /* @__PURE__ */ new WeakMap()) {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null || obj1 === void 0 || obj2 === void 0) return false;
  if (typeof obj1 !== typeof obj2 || Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index2) => deep_equal(item, obj2[index2], visited));
  }
  if (typeof obj1 === "object") {
    if (visited.has(obj1)) return visited.get(obj1) === obj2;
    visited.set(obj1, obj2);
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) => deep_equal(obj1[key], obj2[key], visited));
  }
  return obj1 === obj2;
}

// ../jsbrains/smart-clusters/node_modules/smart-collections/item.js
var CollectionItem = class _CollectionItem {
  /**
   * Default properties for an instance of CollectionItem.
   * Override in subclasses to define different defaults.
   * @returns {Object}
   */
  static get defaults() {
    return {
      data: {}
    };
  }
  /**
   * @param {Object} env - The environment/context.
   * @param {Object|null} [data=null] - Initial data for the item.
   */
  constructor(env, data = null) {
    env.create_env_getter(this);
    this.config = this.env?.config;
    this.merge_defaults();
    if (data) deep_merge2(this.data, data);
    if (!this.data.class_name) this.data.class_name = this.constructor.name;
  }
  /**
   * Loads an item from data and initializes it.
   * @param {Object} env
   * @param {Object} data
   * @returns {CollectionItem}
   */
  static load(env, data) {
    const item = new this(env, data);
    item.init();
    return item;
  }
  /**
   * Merge default properties from the entire inheritance chain.
   * @private
   */
  merge_defaults() {
    let current_class = this.constructor;
    while (current_class) {
      for (let key in current_class.defaults) {
        const default_val = current_class.defaults[key];
        if (typeof default_val === "object") {
          this[key] = { ...default_val, ...this[key] };
        } else {
          this[key] = this[key] === void 0 ? default_val : this[key];
        }
      }
      current_class = Object.getPrototypeOf(current_class);
    }
  }
  /**
   * Generates or retrieves a unique key for the item.
   * Key syntax supports:
   * - `[i]` for sequences
   * - `/` for super-sources (groups, directories, clusters)
   * - `#` for sub-sources (blocks)
   * @returns {string} The unique key
   */
  get_key() {
    return create_uid(this.data);
  }
  /**
   * Updates the item data and returns true if changed.
   * @param {Object} data
   * @returns {boolean} True if data changed.
   */
  update_data(data) {
    const sanitized_data = this.sanitize_data(data);
    const current_data = { ...this.data };
    deep_merge2(current_data, sanitized_data);
    const changed = !deep_equal(this.data, current_data);
    if (!changed) return false;
    this.data = current_data;
    return true;
  }
  /**
   * Sanitizes data for saving. Ensures no circular references.
   * @param {*} data
   * @returns {*} Sanitized data.
   */
  sanitize_data(data) {
    if (data instanceof _CollectionItem) return data.ref;
    if (Array.isArray(data)) return data.map((val) => this.sanitize_data(val));
    if (typeof data === "object" && data !== null) {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = this.sanitize_data(data[key]);
        return acc;
      }, {});
    }
    return data;
  }
  /**
   * Initializes the item. Override as needed.
   * @param {Object} [input_data] - Additional data that might be provided on creation.
   */
  init(input_data) {
  }
  /**
   * Queues this item for saving.
   */
  queue_save() {
    this._queue_save = true;
  }
  /**
   * Saves this item using its data adapter.
   * @returns {Promise<void>}
   */
  async save() {
    try {
      await this.data_adapter.save_item(this);
      this.init();
    } catch (err) {
      this._queue_save = true;
      console.error(err, err.stack);
    }
  }
  /**
   * Queues this item for loading.
   */
  queue_load() {
    this._queue_load = true;
  }
  /**
   * Loads this item using its data adapter.
   * @returns {Promise<void>}
   */
  async load() {
    try {
      await this.data_adapter.load_item(this);
      this.init();
    } catch (err) {
      this._load_error = err;
      this.on_load_error(err);
    }
  }
  /**
   * Handles load errors by re-queuing for load.
   * Override if needed.
   * @param {Error} err
   */
  on_load_error(err) {
    this.queue_load();
  }
  /**
   * Validates the item before saving. Checks for presence and validity of key.
   * @returns {boolean}
   */
  validate_save() {
    if (!this.key) return false;
    if (this.key.trim() === "") return false;
    if (this.key === "undefined") return false;
    return true;
  }
  /**
   * Marks this item as deleted. This does not immediately remove it from memory,
   * but queues a save that will result in the item being removed from persistent storage.
   */
  delete() {
    this.deleted = true;
    this.queue_save();
  }
  /**
   * Filters items in the collection based on provided options.
   * functional filter (returns true or false) for filtering items in collection; called by collection class
   * @param {Object} filter_opts - Filtering options.
   * @param {string} [filter_opts.exclude_key] - A single key to exclude.
   * @param {string[]} [filter_opts.exclude_keys] - An array of keys to exclude. If exclude_key is provided, it's added to this array.
   * @param {string} [filter_opts.exclude_key_starts_with] - Exclude keys starting with this string.
   * @param {string[]} [filter_opts.exclude_key_starts_with_any] - Exclude keys starting with any of these strings.
   * @param {string} [filter_opts.exclude_key_includes] - Exclude keys that include this string.
   * @param {string} [filter_opts.key_ends_with] - Include only keys ending with this string.
   * @param {string} [filter_opts.key_starts_with] - Include only keys starting with this string.
   * @param {string[]} [filter_opts.key_starts_with_any] - Include only keys starting with any of these strings.
   * @param {string} [filter_opts.key_includes] - Include only keys that include this string.
   * @returns {boolean} True if the item passes the filter, false otherwise.
   */
  filter(filter_opts = {}) {
    const {
      exclude_key,
      exclude_keys = exclude_key ? [exclude_key] : [],
      exclude_key_starts_with,
      exclude_key_starts_with_any,
      exclude_key_includes,
      exclude_key_includes_any,
      key_ends_with,
      key_starts_with,
      key_starts_with_any,
      key_includes,
      key_includes_any
    } = filter_opts;
    if (exclude_keys?.includes(this.key)) return false;
    if (exclude_key_starts_with && this.key.startsWith(exclude_key_starts_with)) return false;
    if (exclude_key_starts_with_any && exclude_key_starts_with_any.some((prefix) => this.key.startsWith(prefix))) return false;
    if (exclude_key_includes && this.key.includes(exclude_key_includes)) return false;
    if (exclude_key_includes_any && exclude_key_includes_any.some((include) => this.key.includes(include))) return false;
    if (key_ends_with && !this.key.endsWith(key_ends_with)) return false;
    if (key_starts_with && !this.key.startsWith(key_starts_with)) return false;
    if (key_starts_with_any && !key_starts_with_any.some((prefix) => this.key.startsWith(prefix))) return false;
    if (key_includes && !this.key.includes(key_includes)) return false;
    if (key_includes_any && !key_includes_any.some((include) => this.key.includes(include))) return false;
    return true;
  }
  /**
   * Parses item data for additional processing. Override as needed.
   */
  parse() {
  }
  /**
   * Helper function to render a component in the item scope
   * @param {*} component_key 
   * @param {*} opts 
   * @returns 
   */
  async render_component(component_key, opts = {}) {
    return await this.env.render_component(component_key, this, opts);
  }
  get actions() {
    if (!this._actions) {
      this._actions = Object.entries(this.env.opts.items[this.item_type_key].actions || {}).reduce((acc, [k, v]) => {
        acc[k] = v.bind(this);
        return acc;
      }, {});
    }
    return this._actions;
  }
  /**
   * Derives the collection key from the class name.
   * @returns {string}
   */
  static get collection_key() {
    let name = this.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return collection_instance_name_from(name);
  }
  /**
   * @returns {string} The collection key for this item.
   */
  get collection_key() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return collection_instance_name_from(name);
  }
  /**
   * Retrieves the parent collection from the environment.
   * @returns {Collection}
   */
  get collection() {
    return this.env[this.collection_key];
  }
  /**
   * @returns {string} The item's key.
   */
  get key() {
    return this.data?.key || this.get_key();
  }
  get item_type_key() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return camel_case_to_snake_case2(name);
  }
  /**
   * A simple reference object for this item.
   * @returns {{collection_key: string, key: string}}
   */
  get ref() {
    return { collection_key: this.collection_key, key: this.key };
  }
  /**
   * @returns {Object} The data adapter for this item's collection.
   */
  get data_adapter() {
    return this.collection.data_adapter;
  }
  /**
   * @returns {Object} The filesystem adapter.
   */
  get data_fs() {
    return this.collection.data_fs;
  }
  /**
   * Access to collection-level settings.
   * @returns {Object}
   */
  get settings() {
    if (!this.env.settings[this.collection_key]) this.env.settings[this.collection_key] = {};
    return this.env.settings[this.collection_key];
  }
  set settings(settings) {
    this.env.settings[this.collection_key] = settings;
    this.env.smart_settings.save();
  }
  /**
   * Render this item into a container using the item's component.
   * @deprecated 2024-12-02 Use explicit component pattern from environment
   * @param {HTMLElement} container
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_item(container, opts = {}) {
    const frag = await this.component.call(this.smart_view, this, opts);
    container.innerHTML = "";
    container.appendChild(frag);
    return container;
  }
  /**
   * @deprecated use env.smart_view
   * @returns {Object}
   */
  get smart_view() {
    if (!this._smart_view) this._smart_view = this.env.init_module("smart_view");
    return this._smart_view;
  }
  /**
   * Override in child classes to set the component for this item
   * @deprecated 2024-12-02
   * @returns {Function} The render function for this component
   */
  get component() {
    return item_component;
  }
};
function camel_case_to_snake_case2(str) {
  const result = str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, "").replace(/2$/, "");
  return result;
}

// ../jsbrains/smart-clusters/node_modules/smart-collections/collection.js
var AsyncFunction = Object.getPrototypeOf(async function() {
}).constructor;
var Collection = class {
  /**
   * Constructs a new Collection instance.
   *
   * @param {Object} env - The environment context containing configurations and adapters.
   * @param {Object} [opts={}] - Optional configuration.
   * @param {string} [opts.collection_key] - Custom key to override default collection name.
   * @param {string} [opts.data_dir] - Custom data directory path.
   * @param {boolean} [opts.prevent_load_on_init] - Whether to prevent loading items on initialization.
   */
  constructor(env, opts = {}) {
    env.create_env_getter(this);
    this.opts = opts;
    if (opts.collection_key) this.collection_key = opts.collection_key;
    this.env[this.collection_key] = this;
    this.config = this.env.config;
    this.items = {};
    this.loaded = null;
    this._loading = false;
    this.load_time_ms = null;
    this.settings_container = null;
  }
  /**
   * Initializes a new collection in the environment. Override in subclass if needed.
   *
   * @param {Object} env
   * @param {Object} [opts={}]
   * @returns {Promise<void>}
   */
  static async init(env, opts = {}) {
    env[this.collection_key] = new this(env, opts);
    await env[this.collection_key].init();
    env.collections[this.collection_key] = "init";
  }
  /**
   * The unique collection key derived from the class name.
   * @returns {string}
   */
  static get collection_key() {
    let name = this.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
  /**
   * Instance-level init. Override in subclasses if necessary.
   * @returns {Promise<void>}
   */
  async init() {
  }
  /**
   * Creates or updates an item in the collection.
   * - If `data` includes a key that matches an existing item, that item is updated.
   * - Otherwise, a new item is created.
   * After updating or creating, the item is validated. If validation fails, the item is logged and returned without being saved.
   * If validation succeeds for a new item, it is added to the collection and marked for saving.
   *
   * If the item’s `init()` method is async, a promise is returned that resolves once init completes.
   *
   * @param {Object} [data={}] - Data for creating/updating an item.
   * @returns {Promise<Item>|Item} The created or updated item. May return a promise if `init()` is async.
   */
  create_or_update(data = {}) {
    const existing_item = this.find_by(data);
    const item = existing_item ? existing_item : new this.item_type(this.env);
    item._queue_save = !existing_item;
    const data_changed = item.update_data(data);
    if (!existing_item && !item.validate_save()) {
      return item;
    }
    if (!existing_item) {
      this.set(item);
    }
    if (existing_item && !data_changed) return existing_item;
    if (item.init instanceof AsyncFunction) {
      return new Promise((resolve) => {
        item.init(data).then(() => resolve(item));
      });
    }
    item.init(data);
    return item;
  }
  /**
   * Finds an item by partial data match (first checks key). If `data.key` provided,
   * returns the item with that key; otherwise attempts a match by merging data.
   *
   * @param {Object} data - Data to match against.
   * @returns {Item|null}
   */
  find_by(data) {
    if (data.key) return this.get(data.key);
    const temp = new this.item_type(this.env);
    const temp_data = JSON.parse(JSON.stringify(data, temp.sanitize_data(data)));
    deep_merge2(temp.data, temp_data);
    return temp.key ? this.get(temp.key) : null;
  }
  /**
   * Filters items based on provided filter options or a custom function.
   *
   * @param {Object|Function} [filter_opts={}] - Filter options or a predicate function.
   * @returns {Item[]} Array of filtered items.
   */
  filter(filter_opts = {}) {
    if (typeof filter_opts === "function") {
      return Object.values(this.items).filter(filter_opts);
    }
    filter_opts = this.prepare_filter(filter_opts);
    const results = [];
    const { first_n } = filter_opts;
    for (const item of Object.values(this.items)) {
      if (first_n && results.length >= first_n) break;
      if (item.filter(filter_opts)) results.push(item);
    }
    return results;
  }
  /**
   * Alias for `filter()`
   * @param {Object|Function} filter_opts
   * @returns {Item[]}
   */
  list(filter_opts) {
    return this.filter(filter_opts);
  }
  /**
   * Prepares filter options. Can be overridden by subclasses to normalize filter options.
   *
   * @param {Object} filter_opts
   * @returns {Object} Prepared filter options.
   */
  prepare_filter(filter_opts) {
    return filter_opts;
  }
  /**
   * Retrieves an item by key.
   * @param {string} key
   * @returns {Item|undefined}
   */
  get(key) {
    return this.items[key];
  }
  /**
   * Retrieves multiple items by an array of keys.
   * @param {string[]} keys
   * @returns {Item[]}
   */
  get_many(keys = []) {
    if (!Array.isArray(keys)) {
      console.error("get_many called with non-array keys:", keys);
      return [];
    }
    return keys.map((key) => this.get(key)).filter(Boolean);
  }
  /**
   * Retrieves a random item from the collection, optionally filtered by options.
   * @param {Object} [opts]
   * @returns {Item|undefined}
   */
  get_rand(opts = null) {
    if (opts) {
      const filtered = this.filter(opts);
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
    const keys = this.keys;
    return this.items[keys[Math.floor(Math.random() * keys.length)]];
  }
  /**
   * Adds or updates an item in the collection.
   * @param {Item} item
   */
  set(item) {
    if (!item.key) throw new Error("Item must have a key property");
    this.items[item.key] = item;
  }
  /**
   * Updates multiple items by their keys.
   * @param {string[]} keys
   * @param {Object} data
   */
  update_many(keys = [], data = {}) {
    this.get_many(keys).forEach((item) => item.update_data(data));
  }
  /**
   * Clears all items from the collection.
   */
  clear() {
    this.items = {};
  }
  /**
   * @returns {string} The collection key, can be overridden by opts.collection_key
   */
  get collection_key() {
    return this._collection_key ? this._collection_key : this.constructor.collection_key;
  }
  set collection_key(key) {
    this._collection_key = key;
  }
  /**
   * Lazily initializes and returns the data adapter instance for this collection.
   * @returns {Object} The data adapter instance.
   */
  get data_adapter() {
    if (!this._data_adapter) {
      const AdapterClass = this.get_adapter_class("data");
      this._data_adapter = new AdapterClass(this);
    }
    return this._data_adapter;
  }
  get_adapter_class(type2) {
    const config = this.env.opts.collections?.[this.collection_key];
    const adapter_key = type2 + "_adapter";
    const adapter_module = config?.[adapter_key] ?? this.env.opts.collections?.smart_collections?.[adapter_key];
    if (typeof adapter_module === "function") return adapter_module;
    if (typeof adapter_module?.collection === "function") return adapter_module.collection;
    throw new Error(`No '${type2}' adapter class found for ${this.collection_key} or smart_collections`);
  }
  /**
   * Data directory strategy for this collection. Defaults to 'multi'.
   * @returns {string}
   */
  get data_dir() {
    return this.collection_key;
  }
  /**
   * File system adapter from the environment.
   * @returns {Object}
   */
  get data_fs() {
    return this.env.data_fs;
  }
  /**
   * Derives the corresponding item class name based on this collection's class name.
   * @returns {string}
   */
  get item_class_name() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    if (name.endsWith("ies")) return name.slice(0, -3) + "y";
    else if (name.endsWith("s")) return name.slice(0, -1);
    return name + "Item";
  }
  /**
   * Derives a readable item name from the item class name.
   * @returns {string}
   */
  get item_name() {
    return this.item_class_name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
  /**
   * Retrieves the item type (constructor) from the environment.
   * @returns {Function} Item constructor.
   */
  get item_type() {
    if (this.opts.item_type) return this.opts.item_type;
    return this.env.item_types[this.item_class_name];
  }
  /**
   * Returns an array of all keys in the collection.
   * @returns {string[]}
   */
  get keys() {
    return Object.keys(this.items);
  }
  /**
   * @deprecated use data_adapter instead (2024-09-14)
   */
  get adapter() {
    return this.data_adapter;
  }
  /**
   * @method process_save_queue
   * @description 
   * Saves items flagged for saving (_queue_save) back to AJSON or SQLite. This ensures persistent storage 
   * of any updates made since last load/import. This method also writes changes to disk (AJSON files or DB).
   */
  async process_save_queue(opts = {}) {
    if (opts.force) {
      Object.values(this.items).forEach((item) => item._queue_save = true);
    }
    await this.data_adapter.process_save_queue(opts);
  }
  /**
   * @alias process_save_queue
   * @returns {Promise<void>}
   */
  async save(opts = {}) {
    await this.process_save_queue(opts);
  }
  /**
   * @method process_load_queue
   * @description 
   * Loads items that have been flagged for loading (_queue_load). This may involve 
   * reading from AJSON/SQLite or re-importing from markdown if needed. 
   * Called once initial environment is ready and collections are known.
   */
  async process_load_queue() {
    await this.data_adapter.process_load_queue();
  }
  /**
   * Retrieves processed settings configuration.
   * @returns {Object}
   */
  get settings_config() {
    return this.process_settings_config({});
  }
  /**
   * Processes given settings config, adding prefixes and handling conditionals.
   *
   * @private
   * @param {Object} _settings_config
   * @param {string} [prefix='']
   * @returns {Object}
   */
  process_settings_config(_settings_config, prefix = "") {
    const add_prefix = (key) => prefix && !key.includes(`${prefix}.`) ? `${prefix}.${key}` : key;
    return Object.entries(_settings_config).reduce((acc, [key, val]) => {
      let new_val = { ...val };
      if (new_val.conditional) {
        if (!new_val.conditional(this)) return acc;
        delete new_val.conditional;
      }
      if (new_val.callback) new_val.callback = add_prefix(new_val.callback);
      if (new_val.btn_callback) new_val.btn_callback = add_prefix(new_val.btn_callback);
      if (new_val.options_callback) new_val.options_callback = add_prefix(new_val.options_callback);
      const new_key = add_prefix(this.process_setting_key(key));
      acc[new_key] = new_val;
      return acc;
    }, {});
  }
  /**
   * Processes an individual setting key. Override if needed.
   * @param {string} key
   * @returns {string}
   */
  process_setting_key(key) {
    return key;
  }
  /**
   * Default settings for this collection. Override in subclasses as needed.
   * @returns {Object}
   */
  get default_settings() {
    return {};
  }
  /**
   * Current settings for the collection.
   * Initializes with default settings if none exist.
   * @returns {Object}
   */
  get settings() {
    if (!this.env.settings[this.collection_key]) {
      this.env.settings[this.collection_key] = this.default_settings;
    }
    return this.env.settings[this.collection_key];
  }
  /**
   * @deprecated use env.smart_view instead
   * @returns {Object} smart_view instance
   */
  get smart_view() {
    if (!this._smart_view) this._smart_view = this.env.init_module("smart_view");
    return this._smart_view;
  }
  /**
   * Renders the settings for the collection into a given container.
   * @param {HTMLElement} [container=this.settings_container]
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_settings(container = this.settings_container, opts = {}) {
    return await this.render_collection_settings(container, opts);
  }
  /**
   * Helper function to render collection settings.
   * @param {HTMLElement} [container=this.settings_container]
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_collection_settings(container = this.settings_container, opts = {}) {
    if (container && (!this.settings_container || this.settings_container !== container)) {
      this.settings_container = container;
    } else if (!container) {
      container = this.env.smart_view.create_doc_fragment("<div></div>");
    }
    container.innerHTML = `<div class="sc-loading">Loading ${this.collection_key} settings...</div>`;
    const frag = await this.env.render_component("settings", this, opts);
    container.innerHTML = "";
    container.appendChild(frag);
    return container;
  }
  /**
   * Unloads collection data from memory.
   */
  unload() {
    this.clear();
    this.unloaded = true;
    this.env.collections[this.collection_key] = null;
  }
  /**
   * Helper function to render a component in the collection scope
   * @param {*} component_key 
   * @param {*} opts 
   * @returns 
   */
  async render_component(component_key, opts = {}) {
    return await this.env.render_component(component_key, this, opts);
  }
  // only show process notice if taking longer than 1 second
  show_process_notice(process, opts = {}) {
    if (!this.debounce_process_notice) this.debounce_process_notice = {};
    this.debounce_process_notice[process] = setTimeout(() => {
      this.debounce_process_notice[process] = null;
      this.env.notices?.show(process, { collection_key: this.collection_key, ...opts });
    }, 1e3);
  }
  clear_process_notice(process) {
    if (this.debounce_process_notice?.[process]) {
      clearTimeout(this.debounce_process_notice[process]);
      this.debounce_process_notice[process] = null;
    } else {
      this.env.notices?.remove(process);
    }
  }
};

// ../jsbrains/node_modules/smart-entities/utils/cos_sim.js
function cos_sim(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    throw new Error("Vectors must have the same length");
  }
  let dot_product = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  const epsilon = 1e-8;
  for (let i = 0; i < vector1.length; i++) {
    dot_product += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  if (magnitude1 < epsilon || magnitude2 < epsilon) {
    return 0;
  }
  return dot_product / (magnitude1 * magnitude2);
}

// ../jsbrains/smart-clusters/utils/geom.js
function compute_centroid(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const n = points.length;
  const dim = points[0].length;
  const sums = new Float64Array(dim);
  for (let i = 0; i < n; i++) {
    const p = points[i];
    for (let d = 0; d < dim; d++) {
      sums[d] += p[d];
    }
  }
  for (let d = 0; d < dim; d++) {
    sums[d] /= n;
  }
  return Array.from(sums);
}

// ../jsbrains/smart-clusters/utils/create_hash.js
function murmur_hash_32(input_string, seed = 0) {
  let remainder = input_string.length & 3;
  let bytes = input_string.length - remainder;
  let h1 = seed;
  let c1 = 3432918353;
  let c2 = 461845907;
  let i = 0;
  let k1 = 0;
  let chunk = 0;
  while (i < bytes) {
    chunk = input_string.charCodeAt(i) & 255 | (input_string.charCodeAt(i + 1) & 255) << 8 | (input_string.charCodeAt(i + 2) & 255) << 16 | (input_string.charCodeAt(i + 3) & 255) << 24;
    i += 4;
    k1 = chunk;
    k1 = multiply_32(k1, c1);
    k1 = rotate_left_32(k1, 15);
    k1 = multiply_32(k1, c2);
    h1 ^= k1;
    h1 = rotate_left_32(h1, 13);
    h1 = h1 * 5 + 3864292196 | 0;
  }
  k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (input_string.charCodeAt(i + 2) & 255) << 16;
    // falls through
    case 2:
      k1 ^= (input_string.charCodeAt(i + 1) & 255) << 8;
    // falls through
    case 1:
      k1 ^= input_string.charCodeAt(i) & 255;
      k1 = multiply_32(k1, c1);
      k1 = rotate_left_32(k1, 15);
      k1 = multiply_32(k1, c2);
      h1 ^= k1;
      break;
  }
  h1 ^= input_string.length;
  h1 = fmix_32(h1);
  return h1 | 0;
}
function multiply_32(a2, b) {
  return (a2 & 65535) * b + ((a2 >>> 16) * b << 16) | 0;
}
function rotate_left_32(value, shift) {
  return value << shift | value >>> 32 - shift;
}
function fmix_32(h) {
  h ^= h >>> 16;
  h = multiply_32(h, 2246822507);
  h ^= h >>> 13;
  h = multiply_32(h, 3266489909);
  h ^= h >>> 16;
  return h | 0;
}

// ../jsbrains/smart-clusters/utils/sim_hash.js
function sim_hash(vector, { seed = 0 } = {}) {
  const BIT_LENGTH = 32;
  const bit_acc = new Float64Array(BIT_LENGTH);
  for (let i = 0; i < vector.length; i++) {
    const weight = vector[i];
    const h = murmur_hash_32(i.toString(), seed);
    for (let b = 0; b < BIT_LENGTH; b++) {
      if (h >>> b & 1) {
        bit_acc[b] += weight;
      } else {
        bit_acc[b] -= weight;
      }
    }
  }
  let hash_value = 0;
  for (let b = BIT_LENGTH - 1; b >= 0; b--) {
    hash_value <<= 1;
    if (bit_acc[b] >= 0) {
      hash_value |= 1;
    }
  }
  return (hash_value >>> 0).toString(16).padStart(8, "0");
}

// ../jsbrains/smart-clusters/cluster.js
var Cluster = class extends CollectionItem {
  static get defaults() {
    return {
      data: {
        key: null,
        center: {},
        // e.g. { itemKey: { weight: number } }
        center_vec: null,
        // optional
        members: {},
        // e.g. { itemKey: { state: -1|0|1 } }
        filters: {},
        group_key: null
      }
    };
  }
  // API METHODS
  /**
   * @method add_member
   * @param {CollectionItem} item - Should be SmartEntity sub-type (includes `vec`)
   * @returns {Object} membership summary
   * FUTURE: add opts.output_type to change output format to array of { item, score, state }
   */
  add_member(item) {
    item = this.#validate_member_item(item);
    this.#update_member_data(item, 1);
    this.#update_item_cluster_data(item, 1);
    const similarity_score = this.vec && item.vec ? cos_sim(this.vec, item.vec) : void 0;
    return {
      [this.key]: {
        item,
        score: similarity_score,
        state: 1
      }
    };
  }
  /**
   * @method add_members
   * @param {Array} items - Array of items to add to the cluster
   * @returns {Object} - Object with item keys as keys and membership summary as values
   */
  add_members(items) {
    const results = {};
    for (let i = 0; i < items.length; i++) {
      const result = this.add_member(items[i]);
      if (result) results[items[i].key] = result[this.key];
    }
    return results;
  }
  /**
   * @method remove_member
   * @param {Object} item
   * @returns {boolean}
   */
  remove_member(item) {
    item = this.#validate_member_item(item);
    this.#update_member_data(item, -1);
    this.#update_item_cluster_data(item, -1);
    return true;
  }
  /**
   * @method remove_members
   * @param {Array} items - Array of items to remove from the cluster
   * @returns {Object} - Object with item keys as keys and membership summary as values
   */
  remove_members(items) {
    for (let i = 0; i < items.length; i++) {
      this.remove_member(items[i]);
    }
  }
  /**
   * @method add_centers
   * @description
   * Creates a new cluster (adding 'items' as additional centers) and a new group
   * that references that new cluster in place of this one.
   * @param {Array} items - Array of items to become additional centers
   * @returns {Promise<{new_cluster: Cluster, new_cluster_group: ClusterGroup}>} - The newly created group (replacing this cluster with the new one)
   */
  async add_centers(items) {
    items = items.map((item) => this.#validate_member_item(item));
    const new_cluster = await this.#clone({ add_centers: items.map((item) => item.key) });
    const new_cluster_group = await this.cluster_group.clone({
      remove_clusters: [this.key],
      add_clusters: [new_cluster.key]
    });
    return { new_cluster, new_cluster_group };
  }
  /**
   * @method add_center
   * @description
   * Creates a new cluster (adding 'item' as an additional center) and a new group
   * that references that new cluster in place of this one.
   * @param {Object|string} item|item_key - The item to become an additional center
   * @returns {Promise<{new_cluster: Cluster, new_cluster_group: ClusterGroup}>} - The newly created group (replacing this cluster with the new one)
   */
  async add_center(item) {
    return await this.add_centers([item]);
  }
  /**
   * @method remove_center
   * @description
   * Creates a new cluster (removing 'item' as a center) and a new group
   * that references that new cluster in place of this one.
   * @param {Object|string} item|item_key - The item to remove as a center
   * @returns {Promise<{new_cluster: Cluster, new_cluster_group: ClusterGroup}>} - The newly created group (replacing this cluster with the new one)
   */
  async remove_center(item) {
    return await this.remove_centers([item]);
  }
  /**
   * @method remove_centers
   * @description
   * Creates a new cluster (removing 'items' as centers) and a new group
   * that references that new cluster in place of this one.
   * @param {Array} items - Array of items to remove as centers
   * @returns {Promise<{new_cluster: Cluster, new_cluster_group: ClusterGroup}>} - The newly created group (replacing this cluster with the new one)
   */
  async remove_centers(items) {
    items = items.map((item) => this.#validate_member_item(item));
    if (items.length === Object.keys(this.data.center).length) throw new Error("Cannot remove all centers from cluster");
    const new_cluster = await this.#clone({ remove_centers: items.map((item) => item.key) });
    const new_cluster_group = await this.cluster_group.clone({
      remove_clusters: [this.key],
      add_clusters: [new_cluster.key]
    });
    return { new_cluster, new_cluster_group };
  }
  // PRIVATE METHODS
  /**
   * @method #clone
   * @description
   * Creates a new cluster by cloning this one, then returns a new group
   * that references this new cluster in place of the old one.
   * @param {Object} opts
   * @param {Array} [opts.remove_centers] - Array of center keys to remove
   * @param {Array} [opts.add_centers] - Array of center keys to add
   * @returns {Promise<ClusterGroup>}
   */
  async #clone(opts = {}) {
    const new_data = {
      ...JSON.parse(JSON.stringify(this.data || {})),
      // filters: {}, // keep filters
      // members: {}, // keep members
      // center: {}, // keep centers (will be recomputed)
      key: null,
      center_vec: null,
      group_key: null
    };
    if (!new_data.center) new_data.center = {};
    opts.remove_centers = opts.remove_centers?.map((center) => typeof center === "string" ? center : center.key) || [];
    opts.add_centers = opts.add_centers?.map((center) => typeof center === "string" ? center : center.key) || [];
    if (opts.remove_centers) {
      for (let i = 0; i < opts.remove_centers.length; i++) {
        delete new_data.center[opts.remove_centers[i]];
      }
    }
    if (opts.add_centers) {
      for (let i = 0; i < opts.add_centers.length; i++) {
        new_data.center[opts.add_centers[i]] = { weight: 1 };
      }
    }
    const new_cluster = this.collection.create_or_update(new_data);
    return new_cluster;
  }
  /**
   * @method #update_member_data
   * @param {CollectionItem} item - The item to update
   * @param {number} state - The new state of the item (1 for added, -1 for removed)
   */
  #update_member_data(item, state) {
    if (!this.data.members) this.data.members = {};
    this.data.members[item.key] = { state };
    this.queue_save();
  }
  /**
   * @method #update_item_cluster_data
   * @param {CollectionItem} item - The item to update
   * @param {number} state - The new state of the item (1 for added, -1 for removed)
   */
  #update_item_cluster_data(item, state) {
    if (!item.data.clusters) item.data.clusters = {};
    item.data.clusters[this.key] = state;
    item.queue_save();
  }
  /**
   * @method #validate_member_item
   * @description
   * Validates an item or item key, ensuring it's an object with a .key property.
   * @param {Object|string} item|item_key - The item or item key to validate
   * @returns {Object} - The validated item
   */
  #validate_member_item(item) {
    if (typeof item === "string") item = this.env.smart_sources.get(item);
    if (!item) throw new Error("validate_item(): Item not found");
    return item;
  }
  // GETTERS
  /**
   * @property centers
   */
  get centers() {
    const center_keys = Object.keys(this.data.center || {});
    return this.env.smart_sources.get_many(center_keys);
  }
  get last_cluster_group_key() {
    return Object.keys(this.env.cluster_groups.items).filter((key) => key.includes(this.key)).sort().pop();
  }
  get cluster_group() {
    return this.env.cluster_groups.get(this.last_cluster_group_key);
  }
  /**
   * @property filters
   * @description
   * Returns the cluster-level filters (if any)
   */
  get filters() {
    return this.data.filters;
  }
  get name() {
    const center_keys = Object.keys(this.data.center || {});
    if (center_keys.length === 1) return center_keys[0];
    const center_vecs = center_keys.map((key) => this.env.smart_sources.get(key).vec);
    const sim_scores = center_vecs.map((vec) => cos_sim(this.vec, vec));
    const max_sim_index = sim_scores.indexOf(Math.max(...sim_scores));
    return center_keys[max_sim_index];
  }
  /**
   * @property vec
   * By spec, returns the centroid of all center items. 
   */
  get vec() {
    if (!this.data.center_vec) {
      const center_vecs = Object.entries(this.data.center || {}).map(([center_key, center_info]) => {
        if (Array.isArray(center_info.vec)) return center_info.vec;
        const item = this.env.smart_sources.get(center_key);
        if (item && Array.isArray(item.vec)) return item.vec;
        console.warn(`No vector found for center ${center_key}`);
        return null;
      }).filter((c2) => c2);
      if (center_vecs.length === 0) return void 0;
      if (center_vecs.length === 1) return center_vecs[0];
      this.vec = compute_centroid(center_vecs);
    }
    return this.data.center_vec;
  }
  set vec(value) {
    this.data.center_vec = value;
  }
  // BASE CLASS OVERRIDES
  /**
   * Override get_key to use sim_hash of this.vec. 
   * By default, we store the hash in this.data.key the first time it's computed
   * and reuse it to keep the key stable. If you want a live updated sim-hash key,
   * remove that caching logic.
   */
  get_key() {
    if (this.data.key) return this.data.key;
    const vector = this.vec;
    if (!vector) throw new Error("cluster.get_key(): No vector found for cluster");
    const new_sim_hash = sim_hash(vector);
    this.data.key = new_sim_hash;
    return new_sim_hash;
  }
  init() {
    if (!this.data.key) {
      const _unused = this.key;
    }
    this.queue_save();
  }
  /**
   * @override
   * Queues this item for saving with debounce
   */
  queue_save() {
    this._queue_save = true;
    if (this.collection._save_timeout) clearTimeout(this.collection._save_timeout);
    this.collection._save_timeout = setTimeout(() => {
      this.collection.process_save_queue();
    }, 1e3);
    console.log("queue_save", this.key);
  }
};

// ../jsbrains/smart-clusters/clusters.js
var Clusters = class extends Collection {
  data_dir = "clusters";
  find_by(data) {
    return null;
  }
};

// ../jsbrains/smart-cluster-groups/node_modules/smart-collections/utils/collection_instance_name_from.js
function collection_instance_name_from2(class_name) {
  if (class_name.endsWith("Item")) {
    return class_name.replace(/Item$/, "").toLowerCase();
  }
  return class_name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/y$/, "ie") + "s";
}

// ../jsbrains/smart-cluster-groups/node_modules/smart-collections/utils/helpers.js
function create_uid2(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
    if (hash < 0) hash = hash * -1;
  }
  return hash.toString() + str.length;
}
function deep_merge3(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (is_obj(source[key]) && is_obj(target[key])) deep_merge3(target[key], source[key]);
      else target[key] = source[key];
    }
  }
  return target;
  function is_obj(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}

// ../jsbrains/smart-cluster-groups/node_modules/smart-collections/utils/deep_equal.js
function deep_equal2(obj1, obj2, visited = /* @__PURE__ */ new WeakMap()) {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null || obj1 === void 0 || obj2 === void 0) return false;
  if (typeof obj1 !== typeof obj2 || Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index2) => deep_equal2(item, obj2[index2], visited));
  }
  if (typeof obj1 === "object") {
    if (visited.has(obj1)) return visited.get(obj1) === obj2;
    visited.set(obj1, obj2);
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) => deep_equal2(obj1[key], obj2[key], visited));
  }
  return obj1 === obj2;
}

// ../jsbrains/smart-cluster-groups/node_modules/smart-collections/item.js
var CollectionItem2 = class _CollectionItem {
  /**
   * Default properties for an instance of CollectionItem.
   * Override in subclasses to define different defaults.
   * @returns {Object}
   */
  static get defaults() {
    return {
      data: {}
    };
  }
  /**
   * @param {Object} env - The environment/context.
   * @param {Object|null} [data=null] - Initial data for the item.
   */
  constructor(env, data = null) {
    env.create_env_getter(this);
    this.config = this.env?.config;
    this.merge_defaults();
    if (data) deep_merge3(this.data, data);
    if (!this.data.class_name) this.data.class_name = this.constructor.name;
  }
  /**
   * Loads an item from data and initializes it.
   * @param {Object} env
   * @param {Object} data
   * @returns {CollectionItem}
   */
  static load(env, data) {
    const item = new this(env, data);
    item.init();
    return item;
  }
  /**
   * Merge default properties from the entire inheritance chain.
   * @private
   */
  merge_defaults() {
    let current_class = this.constructor;
    while (current_class) {
      for (let key in current_class.defaults) {
        const default_val = current_class.defaults[key];
        if (typeof default_val === "object") {
          this[key] = { ...default_val, ...this[key] };
        } else {
          this[key] = this[key] === void 0 ? default_val : this[key];
        }
      }
      current_class = Object.getPrototypeOf(current_class);
    }
  }
  /**
   * Generates or retrieves a unique key for the item.
   * Key syntax supports:
   * - `[i]` for sequences
   * - `/` for super-sources (groups, directories, clusters)
   * - `#` for sub-sources (blocks)
   * @returns {string} The unique key
   */
  get_key() {
    return create_uid2(this.data);
  }
  /**
   * Updates the item data and returns true if changed.
   * @param {Object} data
   * @returns {boolean} True if data changed.
   */
  update_data(data) {
    const sanitized_data = this.sanitize_data(data);
    const current_data = { ...this.data };
    deep_merge3(current_data, sanitized_data);
    const changed = !deep_equal2(this.data, current_data);
    if (!changed) return false;
    this.data = current_data;
    return true;
  }
  /**
   * Sanitizes data for saving. Ensures no circular references.
   * @param {*} data
   * @returns {*} Sanitized data.
   */
  sanitize_data(data) {
    if (data instanceof _CollectionItem) return data.ref;
    if (Array.isArray(data)) return data.map((val) => this.sanitize_data(val));
    if (typeof data === "object" && data !== null) {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = this.sanitize_data(data[key]);
        return acc;
      }, {});
    }
    return data;
  }
  /**
   * Initializes the item. Override as needed.
   * @param {Object} [input_data] - Additional data that might be provided on creation.
   */
  init(input_data) {
  }
  /**
   * Queues this item for saving.
   */
  queue_save() {
    this._queue_save = true;
  }
  /**
   * Saves this item using its data adapter.
   * @returns {Promise<void>}
   */
  async save() {
    try {
      await this.data_adapter.save_item(this);
      this.init();
    } catch (err) {
      this._queue_save = true;
      console.error(err, err.stack);
    }
  }
  /**
   * Queues this item for loading.
   */
  queue_load() {
    this._queue_load = true;
  }
  /**
   * Loads this item using its data adapter.
   * @returns {Promise<void>}
   */
  async load() {
    try {
      await this.data_adapter.load_item(this);
      this.init();
    } catch (err) {
      this._load_error = err;
      this.on_load_error(err);
    }
  }
  /**
   * Handles load errors by re-queuing for load.
   * Override if needed.
   * @param {Error} err
   */
  on_load_error(err) {
    this.queue_load();
  }
  /**
   * Validates the item before saving. Checks for presence and validity of key.
   * @returns {boolean}
   */
  validate_save() {
    if (!this.key) return false;
    if (this.key.trim() === "") return false;
    if (this.key === "undefined") return false;
    return true;
  }
  /**
   * Marks this item as deleted. This does not immediately remove it from memory,
   * but queues a save that will result in the item being removed from persistent storage.
   */
  delete() {
    this.deleted = true;
    this.queue_save();
  }
  /**
   * Filters items in the collection based on provided options.
   * functional filter (returns true or false) for filtering items in collection; called by collection class
   * @param {Object} filter_opts - Filtering options.
   * @param {string} [filter_opts.exclude_key] - A single key to exclude.
   * @param {string[]} [filter_opts.exclude_keys] - An array of keys to exclude. If exclude_key is provided, it's added to this array.
   * @param {string} [filter_opts.exclude_key_starts_with] - Exclude keys starting with this string.
   * @param {string[]} [filter_opts.exclude_key_starts_with_any] - Exclude keys starting with any of these strings.
   * @param {string} [filter_opts.exclude_key_includes] - Exclude keys that include this string.
   * @param {string} [filter_opts.key_ends_with] - Include only keys ending with this string.
   * @param {string} [filter_opts.key_starts_with] - Include only keys starting with this string.
   * @param {string[]} [filter_opts.key_starts_with_any] - Include only keys starting with any of these strings.
   * @param {string} [filter_opts.key_includes] - Include only keys that include this string.
   * @returns {boolean} True if the item passes the filter, false otherwise.
   */
  filter(filter_opts = {}) {
    const {
      exclude_key,
      exclude_keys = exclude_key ? [exclude_key] : [],
      exclude_key_starts_with,
      exclude_key_starts_with_any,
      exclude_key_includes,
      exclude_key_includes_any,
      key_ends_with,
      key_starts_with,
      key_starts_with_any,
      key_includes,
      key_includes_any
    } = filter_opts;
    if (exclude_keys?.includes(this.key)) return false;
    if (exclude_key_starts_with && this.key.startsWith(exclude_key_starts_with)) return false;
    if (exclude_key_starts_with_any && exclude_key_starts_with_any.some((prefix) => this.key.startsWith(prefix))) return false;
    if (exclude_key_includes && this.key.includes(exclude_key_includes)) return false;
    if (exclude_key_includes_any && exclude_key_includes_any.some((include) => this.key.includes(include))) return false;
    if (key_ends_with && !this.key.endsWith(key_ends_with)) return false;
    if (key_starts_with && !this.key.startsWith(key_starts_with)) return false;
    if (key_starts_with_any && !key_starts_with_any.some((prefix) => this.key.startsWith(prefix))) return false;
    if (key_includes && !this.key.includes(key_includes)) return false;
    if (key_includes_any && !key_includes_any.some((include) => this.key.includes(include))) return false;
    return true;
  }
  /**
   * Parses item data for additional processing. Override as needed.
   */
  parse() {
  }
  /**
   * Helper function to render a component in the item scope
   * @param {*} component_key 
   * @param {*} opts 
   * @returns 
   */
  async render_component(component_key, opts = {}) {
    return await this.env.render_component(component_key, this, opts);
  }
  get actions() {
    if (!this._actions) {
      this._actions = Object.entries(this.env.opts.items[this.item_type_key].actions || {}).reduce((acc, [k, v]) => {
        acc[k] = v.bind(this);
        return acc;
      }, {});
    }
    return this._actions;
  }
  /**
   * Derives the collection key from the class name.
   * @returns {string}
   */
  static get collection_key() {
    let name = this.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return collection_instance_name_from2(name);
  }
  /**
   * @returns {string} The collection key for this item.
   */
  get collection_key() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return collection_instance_name_from2(name);
  }
  /**
   * Retrieves the parent collection from the environment.
   * @returns {Collection}
   */
  get collection() {
    return this.env[this.collection_key];
  }
  /**
   * @returns {string} The item's key.
   */
  get key() {
    return this.data?.key || this.get_key();
  }
  get item_type_key() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return camel_case_to_snake_case3(name);
  }
  /**
   * A simple reference object for this item.
   * @returns {{collection_key: string, key: string}}
   */
  get ref() {
    return { collection_key: this.collection_key, key: this.key };
  }
  /**
   * @returns {Object} The data adapter for this item's collection.
   */
  get data_adapter() {
    return this.collection.data_adapter;
  }
  /**
   * @returns {Object} The filesystem adapter.
   */
  get data_fs() {
    return this.collection.data_fs;
  }
  /**
   * Access to collection-level settings.
   * @returns {Object}
   */
  get settings() {
    if (!this.env.settings[this.collection_key]) this.env.settings[this.collection_key] = {};
    return this.env.settings[this.collection_key];
  }
  set settings(settings) {
    this.env.settings[this.collection_key] = settings;
    this.env.smart_settings.save();
  }
  /**
   * Render this item into a container using the item's component.
   * @deprecated 2024-12-02 Use explicit component pattern from environment
   * @param {HTMLElement} container
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_item(container, opts = {}) {
    const frag = await this.component.call(this.smart_view, this, opts);
    container.innerHTML = "";
    container.appendChild(frag);
    return container;
  }
  /**
   * @deprecated use env.smart_view
   * @returns {Object}
   */
  get smart_view() {
    if (!this._smart_view) this._smart_view = this.env.init_module("smart_view");
    return this._smart_view;
  }
  /**
   * Override in child classes to set the component for this item
   * @deprecated 2024-12-02
   * @returns {Function} The render function for this component
   */
  get component() {
    return item_component;
  }
};
function camel_case_to_snake_case3(str) {
  const result = str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, "").replace(/2$/, "");
  return result;
}

// ../jsbrains/smart-cluster-groups/node_modules/smart-collections/collection.js
var AsyncFunction2 = Object.getPrototypeOf(async function() {
}).constructor;
var Collection2 = class {
  /**
   * Constructs a new Collection instance.
   *
   * @param {Object} env - The environment context containing configurations and adapters.
   * @param {Object} [opts={}] - Optional configuration.
   * @param {string} [opts.collection_key] - Custom key to override default collection name.
   * @param {string} [opts.data_dir] - Custom data directory path.
   * @param {boolean} [opts.prevent_load_on_init] - Whether to prevent loading items on initialization.
   */
  constructor(env, opts = {}) {
    env.create_env_getter(this);
    this.opts = opts;
    if (opts.collection_key) this.collection_key = opts.collection_key;
    this.env[this.collection_key] = this;
    this.config = this.env.config;
    this.items = {};
    this.loaded = null;
    this._loading = false;
    this.load_time_ms = null;
    this.settings_container = null;
  }
  /**
   * Initializes a new collection in the environment. Override in subclass if needed.
   *
   * @param {Object} env
   * @param {Object} [opts={}]
   * @returns {Promise<void>}
   */
  static async init(env, opts = {}) {
    env[this.collection_key] = new this(env, opts);
    await env[this.collection_key].init();
    env.collections[this.collection_key] = "init";
  }
  /**
   * The unique collection key derived from the class name.
   * @returns {string}
   */
  static get collection_key() {
    let name = this.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
  /**
   * Instance-level init. Override in subclasses if necessary.
   * @returns {Promise<void>}
   */
  async init() {
  }
  /**
   * Creates or updates an item in the collection.
   * - If `data` includes a key that matches an existing item, that item is updated.
   * - Otherwise, a new item is created.
   * After updating or creating, the item is validated. If validation fails, the item is logged and returned without being saved.
   * If validation succeeds for a new item, it is added to the collection and marked for saving.
   *
   * If the item’s `init()` method is async, a promise is returned that resolves once init completes.
   *
   * @param {Object} [data={}] - Data for creating/updating an item.
   * @returns {Promise<Item>|Item} The created or updated item. May return a promise if `init()` is async.
   */
  create_or_update(data = {}) {
    const existing_item = this.find_by(data);
    const item = existing_item ? existing_item : new this.item_type(this.env);
    item._queue_save = !existing_item;
    const data_changed = item.update_data(data);
    if (!existing_item && !item.validate_save()) {
      return item;
    }
    if (!existing_item) {
      this.set(item);
    }
    if (existing_item && !data_changed) return existing_item;
    if (item.init instanceof AsyncFunction2) {
      return new Promise((resolve) => {
        item.init(data).then(() => resolve(item));
      });
    }
    item.init(data);
    return item;
  }
  /**
   * Finds an item by partial data match (first checks key). If `data.key` provided,
   * returns the item with that key; otherwise attempts a match by merging data.
   *
   * @param {Object} data - Data to match against.
   * @returns {Item|null}
   */
  find_by(data) {
    if (data.key) return this.get(data.key);
    const temp = new this.item_type(this.env);
    const temp_data = JSON.parse(JSON.stringify(data, temp.sanitize_data(data)));
    deep_merge3(temp.data, temp_data);
    return temp.key ? this.get(temp.key) : null;
  }
  /**
   * Filters items based on provided filter options or a custom function.
   *
   * @param {Object|Function} [filter_opts={}] - Filter options or a predicate function.
   * @returns {Item[]} Array of filtered items.
   */
  filter(filter_opts = {}) {
    if (typeof filter_opts === "function") {
      return Object.values(this.items).filter(filter_opts);
    }
    filter_opts = this.prepare_filter(filter_opts);
    const results = [];
    const { first_n } = filter_opts;
    for (const item of Object.values(this.items)) {
      if (first_n && results.length >= first_n) break;
      if (item.filter(filter_opts)) results.push(item);
    }
    return results;
  }
  /**
   * Alias for `filter()`
   * @param {Object|Function} filter_opts
   * @returns {Item[]}
   */
  list(filter_opts) {
    return this.filter(filter_opts);
  }
  /**
   * Prepares filter options. Can be overridden by subclasses to normalize filter options.
   *
   * @param {Object} filter_opts
   * @returns {Object} Prepared filter options.
   */
  prepare_filter(filter_opts) {
    return filter_opts;
  }
  /**
   * Retrieves an item by key.
   * @param {string} key
   * @returns {Item|undefined}
   */
  get(key) {
    return this.items[key];
  }
  /**
   * Retrieves multiple items by an array of keys.
   * @param {string[]} keys
   * @returns {Item[]}
   */
  get_many(keys = []) {
    if (!Array.isArray(keys)) {
      console.error("get_many called with non-array keys:", keys);
      return [];
    }
    return keys.map((key) => this.get(key)).filter(Boolean);
  }
  /**
   * Retrieves a random item from the collection, optionally filtered by options.
   * @param {Object} [opts]
   * @returns {Item|undefined}
   */
  get_rand(opts = null) {
    if (opts) {
      const filtered = this.filter(opts);
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
    const keys = this.keys;
    return this.items[keys[Math.floor(Math.random() * keys.length)]];
  }
  /**
   * Adds or updates an item in the collection.
   * @param {Item} item
   */
  set(item) {
    if (!item.key) throw new Error("Item must have a key property");
    this.items[item.key] = item;
  }
  /**
   * Updates multiple items by their keys.
   * @param {string[]} keys
   * @param {Object} data
   */
  update_many(keys = [], data = {}) {
    this.get_many(keys).forEach((item) => item.update_data(data));
  }
  /**
   * Clears all items from the collection.
   */
  clear() {
    this.items = {};
  }
  /**
   * @returns {string} The collection key, can be overridden by opts.collection_key
   */
  get collection_key() {
    return this._collection_key ? this._collection_key : this.constructor.collection_key;
  }
  set collection_key(key) {
    this._collection_key = key;
  }
  /**
   * Lazily initializes and returns the data adapter instance for this collection.
   * @returns {Object} The data adapter instance.
   */
  get data_adapter() {
    if (!this._data_adapter) {
      const AdapterClass = this.get_adapter_class("data");
      this._data_adapter = new AdapterClass(this);
    }
    return this._data_adapter;
  }
  get_adapter_class(type2) {
    const config = this.env.opts.collections?.[this.collection_key];
    const adapter_key = type2 + "_adapter";
    const adapter_module = config?.[adapter_key] ?? this.env.opts.collections?.smart_collections?.[adapter_key];
    if (typeof adapter_module === "function") return adapter_module;
    if (typeof adapter_module?.collection === "function") return adapter_module.collection;
    throw new Error(`No '${type2}' adapter class found for ${this.collection_key} or smart_collections`);
  }
  /**
   * Data directory strategy for this collection. Defaults to 'multi'.
   * @returns {string}
   */
  get data_dir() {
    return this.collection_key;
  }
  /**
   * File system adapter from the environment.
   * @returns {Object}
   */
  get data_fs() {
    return this.env.data_fs;
  }
  /**
   * Derives the corresponding item class name based on this collection's class name.
   * @returns {string}
   */
  get item_class_name() {
    let name = this.constructor.name;
    if (name.match(/\d$/)) name = name.slice(0, -1);
    if (name.endsWith("ies")) return name.slice(0, -3) + "y";
    else if (name.endsWith("s")) return name.slice(0, -1);
    return name + "Item";
  }
  /**
   * Derives a readable item name from the item class name.
   * @returns {string}
   */
  get item_name() {
    return this.item_class_name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
  /**
   * Retrieves the item type (constructor) from the environment.
   * @returns {Function} Item constructor.
   */
  get item_type() {
    if (this.opts.item_type) return this.opts.item_type;
    return this.env.item_types[this.item_class_name];
  }
  /**
   * Returns an array of all keys in the collection.
   * @returns {string[]}
   */
  get keys() {
    return Object.keys(this.items);
  }
  /**
   * @deprecated use data_adapter instead (2024-09-14)
   */
  get adapter() {
    return this.data_adapter;
  }
  /**
   * @method process_save_queue
   * @description 
   * Saves items flagged for saving (_queue_save) back to AJSON or SQLite. This ensures persistent storage 
   * of any updates made since last load/import. This method also writes changes to disk (AJSON files or DB).
   */
  async process_save_queue(opts = {}) {
    if (opts.force) {
      Object.values(this.items).forEach((item) => item._queue_save = true);
    }
    await this.data_adapter.process_save_queue(opts);
  }
  /**
   * @alias process_save_queue
   * @returns {Promise<void>}
   */
  async save(opts = {}) {
    await this.process_save_queue(opts);
  }
  /**
   * @method process_load_queue
   * @description 
   * Loads items that have been flagged for loading (_queue_load). This may involve 
   * reading from AJSON/SQLite or re-importing from markdown if needed. 
   * Called once initial environment is ready and collections are known.
   */
  async process_load_queue() {
    await this.data_adapter.process_load_queue();
  }
  /**
   * Retrieves processed settings configuration.
   * @returns {Object}
   */
  get settings_config() {
    return this.process_settings_config({});
  }
  /**
   * Processes given settings config, adding prefixes and handling conditionals.
   *
   * @private
   * @param {Object} _settings_config
   * @param {string} [prefix='']
   * @returns {Object}
   */
  process_settings_config(_settings_config, prefix = "") {
    const add_prefix = (key) => prefix && !key.includes(`${prefix}.`) ? `${prefix}.${key}` : key;
    return Object.entries(_settings_config).reduce((acc, [key, val]) => {
      let new_val = { ...val };
      if (new_val.conditional) {
        if (!new_val.conditional(this)) return acc;
        delete new_val.conditional;
      }
      if (new_val.callback) new_val.callback = add_prefix(new_val.callback);
      if (new_val.btn_callback) new_val.btn_callback = add_prefix(new_val.btn_callback);
      if (new_val.options_callback) new_val.options_callback = add_prefix(new_val.options_callback);
      const new_key = add_prefix(this.process_setting_key(key));
      acc[new_key] = new_val;
      return acc;
    }, {});
  }
  /**
   * Processes an individual setting key. Override if needed.
   * @param {string} key
   * @returns {string}
   */
  process_setting_key(key) {
    return key;
  }
  /**
   * Default settings for this collection. Override in subclasses as needed.
   * @returns {Object}
   */
  get default_settings() {
    return {};
  }
  /**
   * Current settings for the collection.
   * Initializes with default settings if none exist.
   * @returns {Object}
   */
  get settings() {
    if (!this.env.settings[this.collection_key]) {
      this.env.settings[this.collection_key] = this.default_settings;
    }
    return this.env.settings[this.collection_key];
  }
  /**
   * @deprecated use env.smart_view instead
   * @returns {Object} smart_view instance
   */
  get smart_view() {
    if (!this._smart_view) this._smart_view = this.env.init_module("smart_view");
    return this._smart_view;
  }
  /**
   * Renders the settings for the collection into a given container.
   * @param {HTMLElement} [container=this.settings_container]
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_settings(container = this.settings_container, opts = {}) {
    return await this.render_collection_settings(container, opts);
  }
  /**
   * Helper function to render collection settings.
   * @param {HTMLElement} [container=this.settings_container]
   * @param {Object} opts
   * @returns {Promise<HTMLElement>}
   */
  async render_collection_settings(container = this.settings_container, opts = {}) {
    if (container && (!this.settings_container || this.settings_container !== container)) {
      this.settings_container = container;
    } else if (!container) {
      container = this.env.smart_view.create_doc_fragment("<div></div>");
    }
    container.innerHTML = `<div class="sc-loading">Loading ${this.collection_key} settings...</div>`;
    const frag = await this.env.render_component("settings", this, opts);
    container.innerHTML = "";
    container.appendChild(frag);
    return container;
  }
  /**
   * Unloads collection data from memory.
   */
  unload() {
    this.clear();
    this.unloaded = true;
    this.env.collections[this.collection_key] = null;
  }
  /**
   * Helper function to render a component in the collection scope
   * @param {*} component_key 
   * @param {*} opts 
   * @returns 
   */
  async render_component(component_key, opts = {}) {
    return await this.env.render_component(component_key, this, opts);
  }
  // only show process notice if taking longer than 1 second
  show_process_notice(process, opts = {}) {
    if (!this.debounce_process_notice) this.debounce_process_notice = {};
    this.debounce_process_notice[process] = setTimeout(() => {
      this.debounce_process_notice[process] = null;
      this.env.notices?.show(process, { collection_key: this.collection_key, ...opts });
    }, 1e3);
  }
  clear_process_notice(process) {
    if (this.debounce_process_notice?.[process]) {
      clearTimeout(this.debounce_process_notice[process]);
      this.debounce_process_notice[process] = null;
    } else {
      this.env.notices?.remove(process);
    }
  }
};

// ../jsbrains/smart-cluster-groups/cluster_groups.js
var ClusterGroups = class extends Collection2 {
  data_dir = "cluster_groups";
  async create_group(center_keys) {
    console.log("create_group", center_keys);
    const clusters = [];
    for (let i = 0; i < center_keys.length; i++) {
      const center_key = center_keys[i];
      const cluster = await this.env.clusters.create_or_update({
        center: {
          [center_key]: {
            weight: 1
          }
        }
      });
      clusters.push(cluster);
    }
    await this.create_or_update({
      clusters: clusters.reduce((acc, cluster) => {
        acc[cluster.key] = { filters: {} };
        return acc;
      }, {})
    });
  }
};

// ../jsbrains/smart-cluster-groups/node_modules/smart-entities/utils/cos_sim.js
function cos_sim2(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    throw new Error("Vectors must have the same length");
  }
  let dot_product = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  const epsilon = 1e-8;
  for (let i = 0; i < vector1.length; i++) {
    dot_product += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  if (magnitude1 < epsilon || magnitude2 < epsilon) {
    return 0;
  }
  return dot_product / (magnitude1 * magnitude2);
}

// ../jsbrains/smart-cluster-groups/cluster_group.js
var ClusterGroup = class extends CollectionItem2 {
  static get defaults() {
    return {
      data: {
        clusters: {},
        filters: {}
      }
    };
  }
  // API METHODS
  /**
   * @method get_snapshot
   * @description
   * Returns a snapshot of the cluster group for user display.
   * @param {Array} items - The items to include in the snapshot
   * @returns {Promise<Object>} - The snapshot
   */
  async get_snapshot(items) {
    if (!this.data.clusters) return { clusters: [], members: [], filters: { ...this.data.filters } };
    if (!items) items = Object.values(this.env.smart_sources.items);
    items = items.filter((i) => i.vec);
    const members = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const membership = {
        item,
        clusters: {}
      };
      for (let j = 0; j < this.clusters.length; j++) {
        const cluster = this.clusters[j];
        if (cluster.data.members[item.key]?.state === -1) continue;
        const sim = cos_sim2(cluster.vec, item.vec);
        membership.clusters[cluster.key] = {
          score: sim
        };
      }
      members.push(membership);
    }
    return {
      clusters: this.clusters,
      members,
      filters: { ...this.data.filters }
    };
  }
  /**
   * @method add_clusters
   * @description
   * Adds a cluster to the group.
   * @param {Array<Cluster>} clusters - The clusters to add
   * @returns {Promise<ClusterGroup>} - The new cluster group
   */
  async add_clusters(clusters) {
    return await this.clone({ add_clusters: clusters });
  }
  /**
   * @method add_cluster
   * @description
   * Adds a cluster to the group.
   * @param {Cluster} cluster - The cluster to add
   * @returns {Promise<ClusterGroup>} - The new cluster group
   */
  async add_cluster(cluster) {
    return await this.add_clusters([cluster.key]);
  }
  /**
   * @method remove_clusters
   * @description
   * Removes a cluster from the group.
   * @param {Array<Cluster>} clusters - The clusters to remove
   * @returns {Promise<ClusterGroup>} - The new cluster group
   */
  async remove_clusters(clusters) {
    return await this.clone({ remove_clusters: clusters });
  }
  /**
   * @method remove_cluster
   * @description
   * Removes a cluster from the group.
   * @param {Cluster} cluster - The cluster to remove
   * @returns {Promise<ClusterGroup>} - The new cluster group
   */
  async remove_cluster(cluster) {
    return await this.remove_clusters([cluster.key]);
  }
  /**
   * Creates a new cluster group by cloning this one
   * @param {Object} opts
   * @param {Array} [opts.remove_clusters] - Array of cluster keys to remove
   * @param {Array} [opts.add_clusters] - Array of cluster keys to add
   * @returns {Promise<ClusterGroup>}
   */
  async clone(opts = {}) {
    opts.add_clusters = opts.add_clusters?.map((c2) => typeof c2 === "string" ? c2 : c2.key);
    opts.remove_clusters = opts.remove_clusters?.map((c2) => typeof c2 === "string" ? c2 : c2.key);
    const new_clusters = (opts.add_clusters || []).reduce((acc, key) => {
      acc[key] = { filters: {} };
      return acc;
    }, {});
    const clusters = Object.entries(this.data.clusters).filter(([key, value]) => !opts.remove_clusters?.includes(key)).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, new_clusters);
    const new_data = { ...this.data, key: null, clusters };
    const new_group = await this.env.cluster_groups.create_or_update(new_data);
    return new_group;
  }
  // GETTERS
  get clusters() {
    return this.env.clusters.get_many(Object.keys(this.data.clusters));
  }
  // BASE CLASS OVERRIDES
  get_key() {
    if (!this.data.key) this.data.key = [
      Date.now().toString(),
      ...Object.keys(this.data.clusters || {}).sort()
    ].join("-");
    return this.data.key;
  }
  init() {
    this.queue_save();
  }
  /**
   * @override
   * Queues this item for saving with debounce
   */
  queue_save() {
    this._queue_save = true;
    if (this.collection._save_timeout) clearTimeout(this.collection._save_timeout);
    this.collection._save_timeout = setTimeout(() => {
      this.collection.process_save_queue();
    }, 1e3);
    console.log("queue_save", this.key);
  }
  get settings() {
    return this.data.filters;
  }
};

// smart_view.obsidian.js
var import_obsidian = require("obsidian");
var SmartObsidianView = class extends import_obsidian.ItemView {
  /**
   * Creates an instance of SmartObsidianView.
   * @param {any} leaf
   * @param {any} plugin
   */
  constructor(leaf, plugin) {
    super(leaf);
    this.app = plugin.app;
    this.plugin = plugin;
  }
  /**
   * The unique view type. Must be implemented in subclasses.
   * @returns {string}
   */
  static get view_type() {
    throw new Error("view_type must be implemented in subclass");
  }
  /**
   * The display text for this view. Must be implemented in subclasses.
   * @returns {string}
   */
  static get display_text() {
    throw new Error("display_text must be implemented in subclass");
  }
  /**
   * The icon name for this view.
   * @returns {string}
   */
  static get icon_name() {
    return "smart-connections";
  }
  /**
   * Retrieves the Leaf instance for this view type if it exists.
   * @param {import("obsidian").Workspace} workspace
   * @returns {import("obsidian").WorkspaceLeaf | undefined}
   */
  static get_leaf(workspace) {
    return workspace.getLeavesOfType(this.view_type)[0];
  }
  /**
   * Retrieves the view instance if it exists.
   * @param {import("obsidian").Workspace} workspace
   * @returns {SmartObsidianView | undefined}
   */
  static get_view(workspace) {
    const leaf = this.get_leaf(workspace);
    return leaf ? leaf.view : void 0;
  }
  /**
   * Opens the view. If `this.default_open_location` is `'root'`,
   * it will open (or reveal) in a "root" leaf; otherwise, it will
   * open (or reveal) in the right leaf.
   *
   * @param {import("obsidian").Workspace} workspace
   * @param {boolean} [active=true] - Whether the view should be focused when opened.
   */
  static open(workspace, active = true) {
    const existing_leaf = this.get_leaf(workspace);
    if (this.default_open_location === "root") {
      if (existing_leaf) {
        existing_leaf.setViewState({ type: this.view_type, active });
      } else {
        workspace.getLeaf(false).setViewState({ type: this.view_type, active });
      }
    } else {
      if (existing_leaf) {
        existing_leaf.setViewState({ type: this.view_type, active });
      } else {
        workspace.getRightLeaf(false).setViewState({
          type: this.view_type,
          active
        });
      }
      if (workspace.rightSplit?.collapsed) {
        workspace.rightSplit.toggle();
      }
    }
  }
  static is_open(workspace) {
    return this.get_leaf(workspace)?.view instanceof this;
  }
  // instance
  getViewType() {
    return this.constructor.view_type;
  }
  getDisplayText() {
    return this.constructor.display_text;
  }
  getIcon() {
    return this.constructor.icon_name;
  }
  async onOpen() {
    this.app.workspace.onLayoutReady(this.initialize.bind(this));
  }
  async initialize() {
    await this.wait_for_env_to_load();
    this.container.empty();
    this.register_plugin_events();
    this.app.workspace.registerHoverLinkSource(this.constructor.view_type, { display: this.getDisplayText(), defaultMod: true });
    this.render_view();
  }
  async wait_for_env_to_load() {
    if (!this.env?.collections_loaded) {
      while (!this.env?.collections_loaded) {
        const loading_msg = "Loading Smart Environment...";
        const loadingEl = this.containerEl.children[1];
        if (loadingEl.textContent !== loading_msg) {
          loadingEl.empty();
          loadingEl.createSpan({ text: loading_msg });
        }
        await new Promise((r) => setTimeout(r, 2e3));
      }
      this.render_view();
    }
  }
  register_plugin_events() {
  }
  render_view() {
    throw new Error("render_view must be implemented in subclass");
  }
  get container() {
    return this.containerEl.children[1];
  }
  get env() {
    return this.plugin.env;
  }
  get smart_view() {
    if (!this._smart_view) this._smart_view = this.env.init_module("smart_view");
    return this._smart_view;
  }
  get attribution() {
    return `
      <div class="sc-brand">
        <svg viewBox="0 0 100 100" class="svg-icon smart-connections">
          <path d="M50,20 L80,40 L80,60 L50,100" stroke="currentColor" stroke-width="4" fill="none"></path>
          <path d="M30,50 L55,70" stroke="currentColor" stroke-width="5" fill="none"></path>
          <circle cx="50" cy="20" r="9" fill="currentColor"></circle>
          <circle cx="80" cy="40" r="9" fill="currentColor"></circle>
          <circle cx="80" cy="70" r="9" fill="currentColor"></circle>
          <circle cx="50" cy="100" r="9" fill="currentColor"></circle>
          <circle cx="30" cy="50" r="9" fill="currentColor"></circle>
        </svg>
        <p><a style="font-weight: 700;" href="https://smartconnections.app/">Smart Connections</a></p>
      </div>
    `;
  }
};

// clusters_visualizer.obsidian.js
var ClustersVisualizerView = class extends SmartObsidianView {
  static get view_type() {
    return "clusters-visualizer-view";
  }
  static get display_text() {
    return "Clusters visualizer";
  }
  static get icon_name() {
    return "git-fork";
  }
  // or any suitable icon
  static get default_open_location() {
    return "root";
  }
  /**
   * The `main_component_key` used by environment’s `render_component` to load the "clusters_visualizer.js".
   */
  main_component_key = "clusters_visualizer";
  /**
   * Renders the clusters in an interactive D3 visualization.
   * @param {HTMLElement} [container=this.container]
   * @returns {Promise<void>}
   */
  async render_view(container = this.container) {
    this.container.empty();
    this.container.createSpan().setText("Loading clusters visualizer...");
    const frag = await this.env.render_component(this.main_component_key, this, {
      attribution: this.attribution
    });
    this.container.empty();
    this.container.appendChild(frag);
    this.app.workspace.registerHoverLinkSource(this.constructor.view_type, { display: this.getDisplayText(), defaultMod: false });
  }
};

// dist/clusters_visualizer.js
function ascending(a2, b) {
  return a2 == null || b == null ? NaN : a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
function descending(a2, b) {
  return a2 == null || b == null ? NaN : b < a2 ? -1 : b > a2 ? 1 : b >= a2 ? 0 : NaN;
}
function bisector(f) {
  let compare1, compare2, delta;
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x2) => ascending(f(d), x2);
    delta = (d, x2) => f(d) - x2;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left(a2, x2, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a2[mid], x2) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a2, x2, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a2[mid], x2) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a2, x2, lo = 0, hi = a2.length) {
    const i = left(a2, x2, lo, hi - 1);
    return i > lo && delta(a2[i - 1], x2) > -delta(a2[i], x2) ? i - 1 : i;
  }
  return { left, center, right };
}
function zero() {
  return 0;
}
function number(x2) {
  return x2 === null ? NaN : +x2;
}
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector(number).center;
var bisect_default = bisectRight;
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function tickSpec(start2, stop, count) {
  const step = (stop - start2) / Math.max(0, count), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start2 * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start2) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start2 / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start2) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start2, stop, count * 2);
  return [i1, i2, inc];
}
function ticks(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  if (!(count > 0)) return [];
  if (start2 === stop) return [start2];
  const reverse = stop < start2, [i1, i2, inc] = reverse ? tickSpec(stop, start2, count) : tickSpec(start2, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks2 = new Array(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc;
  }
  return ticks2;
}
function tickIncrement(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  return tickSpec(start2, stop, count)[2];
}
function tickStep(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  const reverse = stop < start2, inc = reverse ? tickIncrement(stop, start2, count) : tickIncrement(start2, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}
function max(values, valueof) {
  let max3;
  if (valueof === void 0) {
    for (const value of values) {
      if (value != null && (max3 < value || max3 === void 0 && value >= value)) {
        max3 = value;
      }
    }
  } else {
    let index2 = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index2, values)) != null && (max3 < value || max3 === void 0 && value >= value)) {
        max3 = value;
      }
    }
  }
  return max3;
}
function min(values, valueof) {
  let min3;
  if (valueof === void 0) {
    for (const value of values) {
      if (value != null && (min3 > value || min3 === void 0 && value >= value)) {
        min3 = value;
      }
    }
  } else {
    let index2 = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index2, values)) != null && (min3 > value || min3 === void 0 && value >= value)) {
        min3 = value;
      }
    }
  }
  return min3;
}
var noop = { value: () => {
} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy2 = {}, _ = this._;
    for (var t in _) copy2[t] = _[t].slice();
    return new Dispatch(copy2);
  },
  call: function(type2, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
    for (t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type2, that, args) {
    if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
    for (var t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};
function get(type2, name) {
  for (var i = 0, n = type2.length, c2; i < n; ++i) {
    if ((c2 = type2[i]).name === name) {
      return c2.value;
    }
  }
}
function set(type2, name, callback) {
  for (var i = 0, n = type2.length; i < n; ++i) {
    if (type2[i].name === name) {
      type2[i] = noop, type2 = type2.slice(0, i).concat(type2.slice(i + 1));
      break;
    }
  }
  if (callback != null) type2.push({ name, value: callback });
  return type2;
}
var dispatch_default = dispatch;
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces_default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function namespace_default(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
function none() {
}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}
function select_default(select) {
  if (typeof select !== "function") select = selector_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function array(x2) {
  return x2 == null ? [] : Array.isArray(x2) ? x2 : Array.from(x2);
}
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}
function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}
function matcher_default(selector) {
  return function() {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}
var find = Array.prototype.find;
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}
function filter_default(match) {
  if (typeof match !== "function") match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function sparse_default(update) {
  return new Array(update.length);
}
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function(selector) {
    return this._parent.querySelectorAll(selector);
  }
};
function constant_default(x2) {
  return function() {
    return x2;
  };
}
function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function data_default(value, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function") value = constant_default(value);
  for (var m2 = groups.length, update = new Array(m2), enter = new Array(m2), exit = new Array(m2), j = 0; j < m2; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove();
  else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}
function merge_default(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection(merges, this._parents);
}
function order_default() {
  for (var groups = this._groups, j = -1, m2 = groups.length; ++j < m2; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
function sort_default(compare) {
  if (!compare) compare = ascending2;
  function compareNode(a2, b) {
    return a2 && b ? compare(a2.__data__, b.__data__) : !a2 - !b;
  }
  for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending2(a2, b) {
  return a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function nodes_default() {
  return Array.from(this);
}
function node_default() {
  for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
}
function size_default() {
  let size = 0;
  for (const node of this) ++size;
  return size;
}
function empty_default() {
  return !this.node();
}
function each_default(callback) {
  for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}
function style_default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}
function property_default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}
function append_default(name) {
  var create2 = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m2 = on.length, o; j < m2; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m2 = on.length; j < m2; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on) this.__on = [o];
    else on.push(o);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames2(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m2 = on.length, o; j < m2; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}
function dispatchEvent(node, type2, params) {
  var window2 = window_default(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type2, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params) event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type2, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params);
  };
}
function dispatchFunction(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params.apply(this, arguments));
  };
}
function dispatch_default2(type2, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
}
function* iterator_default() {
  for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}
var root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_default,
  selectAll: selectAll_default,
  selectChild: selectChild_default,
  selectChildren: selectChildren_default,
  filter: filter_default,
  data: data_default,
  enter: enter_default,
  exit: exit_default,
  join: join_default,
  merge: merge_default,
  selection: selection_selection,
  order: order_default,
  sort: sort_default,
  call: call_default,
  nodes: nodes_default,
  node: node_default,
  size: size_default,
  empty: empty_default,
  each: each_default,
  attr: attr_default,
  style: style_default,
  property: property_default,
  classed: classed_default,
  text: text_default,
  html: html_default,
  raise: raise_default,
  lower: lower_default,
  append: append_default,
  insert: insert_default,
  remove: remove_default,
  clone: clone_default,
  datum: datum_default,
  on: on_default,
  dispatch: dispatch_default2,
  [Symbol.iterator]: iterator_default
};
var selection_default = selection;
function select_default2(selector) {
  return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}
function sourceEvent_default(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}
function pointer_default(event, node) {
  event = sourceEvent_default(event);
  if (node === void 0) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
var nonpassive = { passive: false };
var nonpassivecapture = { capture: true, passive: false };
function nopropagation(event) {
  event.stopImmediatePropagation();
}
function noevent_default(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function nodrag_default(view) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", noevent_default, nonpassivecapture);
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", noevent_default, nonpassivecapture);
  } else {
    root2.__noselect = root2.style.MozUserSelect;
    root2.style.MozUserSelect = "none";
  }
}
function yesdrag(view, noclick) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", null);
  if (noclick) {
    selection2.on("click.drag", noevent_default, nonpassivecapture);
    setTimeout(function() {
      selection2.on("click.drag", null);
    }, 0);
  }
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", null);
  } else {
    root2.style.MozUserSelect = root2.__noselect;
    delete root2.__noselect;
  }
}
var constant_default2 = (x2) => () => x2;
function DragEvent(type2, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x: x2,
  y: y2,
  dx,
  dy,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type2, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x2, enumerable: true, configurable: true },
    y: { value: y2, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};
function defaultFilter(event) {
  return !event.ctrlKey && !event.button;
}
function defaultContainer() {
  return this.parentNode;
}
function defaultSubject(event, d) {
  return d == null ? { x: event.x, y: event.y } : d;
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function drag_default() {
  var filter2 = defaultFilter, container = defaultContainer, subject = defaultSubject, touchable = defaultTouchable, gestures = {}, listeners = dispatch_default("start", "drag", "end"), active = 0, mousedownx, mousedowny, mousemoving, touchending, clickDistance2 = 0;
  function drag(selection2) {
    selection2.on("mousedown.drag", mousedowned).filter(touchable).on("touchstart.drag", touchstarted).on("touchmove.drag", touchmoved, nonpassive).on("touchend.drag touchcancel.drag", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function mousedowned(event, d) {
    if (touchending || !filter2.call(this, event, d)) return;
    var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
    if (!gesture) return;
    select_default2(event.view).on("mousemove.drag", mousemoved, nonpassivecapture).on("mouseup.drag", mouseupped, nonpassivecapture);
    nodrag_default(event.view);
    nopropagation(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }
  function mousemoved(event) {
    noevent_default(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }
  function mouseupped(event) {
    select_default2(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent_default(event);
    gestures.mouse("end", event);
  }
  function touchstarted(event, d) {
    if (!filter2.call(this, event, d)) return;
    var touches = event.changedTouches, c2 = container.call(this, event, d), n = touches.length, i, gesture;
    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(this, c2, event, d, touches[i].identifier, touches[i])) {
        nopropagation(event);
        gesture("start", event, touches[i]);
      }
    }
  }
  function touchmoved(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent_default(event);
        gesture("drag", event, touches[i]);
      }
    }
  }
  function touchended(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, 500);
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation(event);
        gesture("end", event, touches[i]);
      }
    }
  }
  function beforestart(that, container2, event, d, identifier, touch) {
    var dispatch2 = listeners.copy(), p = pointer_default(touch || event, container2), dx, dy, s;
    if ((s = subject.call(that, new DragEvent("beforestart", {
      sourceEvent: event,
      target: drag,
      identifier,
      active,
      x: p[0],
      y: p[1],
      dx: 0,
      dy: 0,
      dispatch: dispatch2
    }), d)) == null) return;
    dx = s.x - p[0] || 0;
    dy = s.y - p[1] || 0;
    return function gesture(type2, event2, touch2) {
      var p0 = p, n;
      switch (type2) {
        case "start":
          gestures[identifier] = gesture, n = active++;
          break;
        case "end":
          delete gestures[identifier], --active;
        // falls through
        case "drag":
          p = pointer_default(touch2 || event2, container2), n = active;
          break;
      }
      dispatch2.call(
        type2,
        that,
        new DragEvent(type2, {
          sourceEvent: event2,
          subject: s,
          target: drag,
          identifier,
          active: n,
          x: p[0] + dx,
          y: p[1] + dy,
          dx: p[0] - p0[0],
          dy: p[1] - p0[1],
          dispatch: dispatch2
        }),
        d
      );
    };
  }
  drag.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant_default2(!!_), drag) : filter2;
  };
  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant_default2(_), drag) : container;
  };
  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant_default2(_), drag) : subject;
  };
  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default2(!!_), drag) : touchable;
  };
  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };
  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };
  return drag;
}
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format2) {
  var m2, l;
  format2 = (format2 + "").trim().toLowerCase();
  return (m2 = reHex.exec(format2)) ? (l = m2[1].length, m2 = parseInt(m2[1], 16), l === 6 ? rgbn(m2) : l === 3 ? new Rgb(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l === 8 ? rgba(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l === 4 ? rgba(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger.exec(format2)) ? new Rgb(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent.exec(format2)) ? new Rgb(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger.exec(format2)) ? rgba(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent.exec(format2)) ? rgba(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent.exec(format2)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent.exec(format2)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a2) {
  if (a2 <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a2);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a2 = clampa(this.opacity);
  return `${a2 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a2 === 1 ? ")" : `, ${a2})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a2) {
  if (a2 <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a2);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min3 = Math.min(r, g, b), max3 = Math.max(r, g, b), h = NaN, s = max3 - min3, l = (max3 + min3) / 2;
  if (s) {
    if (r === max3) h = (g - b) / s + (g < b) * 6;
    else if (g === max3) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max3 + min3 : 2 - max3 - min3;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a2 = clampa(this.opacity);
    return `${a2 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a2 === 1 ? ")" : `, ${a2})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
var constant_default3 = (x2) => () => x2;
function linear(a2, d) {
  return function(t) {
    return a2 + t * d;
  };
}
function exponential(a2, b, y2) {
  return a2 = Math.pow(a2, y2), b = Math.pow(b, y2) - a2, y2 = 1 / y2, function(t) {
    return Math.pow(a2 + t * b, y2);
  };
}
function gamma(y2) {
  return (y2 = +y2) === 1 ? nogamma : function(a2, b) {
    return b - a2 ? exponential(a2, b, y2) : constant_default3(isNaN(a2) ? b : a2);
  };
}
function nogamma(a2, b) {
  var d = b - a2;
  return d ? linear(a2, d) : constant_default3(isNaN(a2) ? b : a2);
}
var rgb_default = function rgbGamma(y2) {
  var color2 = gamma(y2);
  function rgb2(start2, end) {
    var r = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.r = r(t);
      start2.g = g(t);
      start2.b = b(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
}(1);
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
    for (i = 0; i < n; ++i) {
      color2 = rgb(colors[i]);
      r[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function(t) {
      color2.r = r(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);
function numberArray_default(a2, b) {
  if (!b) b = [];
  var n = a2 ? Math.min(b.length, a2.length) : 0, c2 = b.slice(), i;
  return function(t) {
    for (i = 0; i < n; ++i) c2[i] = a2[i] * (1 - t) + b[i] * t;
    return c2;
  };
}
function isNumberArray(x2) {
  return ArrayBuffer.isView(x2) && !(x2 instanceof DataView);
}
function genericArray(a2, b) {
  var nb = b ? b.length : 0, na = a2 ? Math.min(nb, a2.length) : 0, x2 = new Array(na), c2 = new Array(nb), i;
  for (i = 0; i < na; ++i) x2[i] = value_default(a2[i], b[i]);
  for (; i < nb; ++i) c2[i] = b[i];
  return function(t) {
    for (i = 0; i < na; ++i) c2[i] = x2[i](t);
    return c2;
  };
}
function date_default(a2, b) {
  var d = /* @__PURE__ */ new Date();
  return a2 = +a2, b = +b, function(t) {
    return d.setTime(a2 * (1 - t) + b * t), d;
  };
}
function number_default(a2, b) {
  return a2 = +a2, b = +b, function(t) {
    return a2 * (1 - t) + b * t;
  };
}
function object_default(a2, b) {
  var i = {}, c2 = {}, k;
  if (a2 === null || typeof a2 !== "object") a2 = {};
  if (b === null || typeof b !== "object") b = {};
  for (k in b) {
    if (k in a2) {
      i[k] = value_default(a2[k], b[k]);
    } else {
      c2[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c2[k] = i[k](t);
    return c2;
  };
}
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero2(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string_default(a2, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
  a2 = a2 + "", b = b + "";
  while ((am = reA.exec(a2)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm;
      else s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs;
    else s[++i] = bs;
  }
  return s.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
    return s.join("");
  });
}
function value_default(a2, b) {
  var t = typeof b, c2;
  return b == null || t === "boolean" ? constant_default3(b) : (t === "number" ? number_default : t === "string" ? (c2 = color(b)) ? (b = c2, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a2, b);
}
function round_default(a2, b) {
  return a2 = +a2, b = +b, function(t) {
    return Math.round(a2 * (1 - t) + b * t);
  };
}
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose_default(a2, b, c2, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a2 * a2 + b * b)) a2 /= scaleX, b /= scaleX;
  if (skewX = a2 * c2 + b * d) c2 -= a2 * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c2 * c2 + d * d)) c2 /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a2 * d < b * c2) a2 = -a2, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a2) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}
var svgNode;
function parseCss(value) {
  const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m2.isIdentity ? identity : decompose_default(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
}
function parseSvg(value) {
  if (value == null) return identity;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a2, b, s, q) {
    if (a2 !== b) {
      if (a2 - b > 180) b += 360;
      else if (b - a2 > 180) a2 += 360;
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default(a2, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }
  function skewX(a2, b, s, q) {
    if (a2 !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default(a2, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a2, b) {
    var s = [], q = [];
    a2 = parse(a2), b = parse(b);
    translate(a2.translateX, a2.translateY, b.translateX, b.translateY, s, q);
    rotate(a2.rotate, b.rotate, s, q);
    skewX(a2.skewX, b.skewX, s, q);
    scale(a2.scaleX, a2.scaleY, b.scaleX, b.scaleY, s, q);
    a2 = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
var epsilon2 = 1e-12;
function cosh(x2) {
  return ((x2 = Math.exp(x2)) + 1 / x2) / 2;
}
function sinh(x2) {
  return ((x2 = Math.exp(x2)) - 1 / x2) / 2;
}
function tanh(x2) {
  return ((x2 = Math.exp(2 * x2)) - 1) / (x2 + 1);
}
var zoom_default = function zoomRho(rho, rho2, rho4) {
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S, coshr0 = cosh(r0), u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }
    i.duration = S * 1e3 * rho / Math.SQRT2;
    return i;
  }
  zoom.rho = function(_) {
    var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };
  return zoom;
}(Math.SQRT2, 2, 4);
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1e3;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer(callback, delay, time) {
  var t = new Timer();
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(void 0, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame) return;
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
function timeout_default(callback, delay, time) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
function schedule_default(node, name, id2, index2, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id2 in schedules) return;
  create(node, id2, {
    name,
    index: index2,
    // For context during callback.
    group,
    // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function init(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}
function set2(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}
function get2(node, id2) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id2])) throw new Error("transition not found");
  return schedule;
}
function create(node, id2, self) {
  var schedules = node.__transition, tween;
  schedules[id2] = self;
  self.timer = timer(schedule, 0, self.time);
  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start2, self.delay, self.time);
    if (self.delay <= elapsed) start2(elapsed - self.delay);
  }
  function start2(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED) return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;
      if (o.state === STARTED) return timeout_default(start2);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id2) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return;
    self.state = STARTED;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node, t);
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id2];
    for (var i in schedules) return;
    delete node.__transition;
  }
}
function interrupt_default(node, name) {
  var schedules = node.__transition, schedule, active, empty2 = true, i;
  if (!schedules) return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty2 = false;
      continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }
  if (empty2) delete node.__transition;
}
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}
function tweenRemove(id2, name) {
  var tween0, tween1;
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule.tween = tween1;
  };
}
function tweenFunction(id2, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id2).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
}
function tweenValue(transition2, name, value) {
  var id2 = transition2._id;
  transition2.each(function() {
    var schedule = set2(this, id2);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node) {
    return get2(node, id2).value[name];
  };
}
function interpolate_default(a2, b) {
  var c2;
  return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c2 = color(b)) ? (b = c2, rgb_default) : string_default)(a2, b);
}
function attrRemove2(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrConstantNS2(fullname, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attrFunctionNS2(fullname, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value));
}
function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}
function delayFunction(id2, value) {
  return function() {
    init(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id2, value) {
  return value = +value, function() {
    init(this, id2).delay = value;
  };
}
function delay_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
}
function durationFunction(id2, value) {
  return function() {
    set2(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id2, value) {
  return value = +value, function() {
    set2(this, id2).duration = value;
  };
}
function duration_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
}
function easeConstant(id2, value) {
  if (typeof value !== "function") throw new Error();
  return function() {
    set2(this, id2).ease = value;
  };
}
function ease_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
}
function easeVarying(id2, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error();
    set2(this, id2).ease = v;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function") throw new Error();
  return this.each(easeVarying(this._id, value));
}
function filter_default2(match) {
  if (typeof match !== "function") match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}
function merge_default2(transition2) {
  if (transition2._id !== this._id) throw new Error();
  for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction(id2, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule = sit(this, id2), on = schedule.on;
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
}
function removeFunction(id2) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id2) return;
    if (parent) parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}
function select_default3(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function") select = selector_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule_default(subgroup[i], name, id2, i, subgroup, get2(node, id2));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id2);
}
function selectAll_default2(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function") select = selectorAll_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children2 = select.call(node, node.__data__, i, group), child, inherit2 = get2(node, id2), k = 0, l = children2.length; k < l; ++k) {
          if (child = children2[k]) {
            schedule_default(child, name, id2, k, children2, inherit2);
          }
        }
        subgroups.push(children2);
        parents.push(node);
      }
    }
  }
  return new Transition(subgroups, parents, name, id2);
}
var Selection2 = selection_default.prototype.constructor;
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}
function styleNull(name, interpolate) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}
function styleRemove2(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function styleFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function styleMaybeRemove(id2, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
  return function() {
    var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
}
function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}
function textConstant2(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
}
function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, textTween(value));
}
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m2 = groups.length, j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit2 = get2(node, id0);
        schedule_default(node, name, id1, i, group, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease
        });
      }
    }
  }
  return new Transition(groups, this._parents, name, id1);
}
function end_default() {
  var on0, on1, that = this, id2 = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0) resolve();
    } };
    that.each(function() {
      var schedule = set2(this, id2), on = schedule.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule.on = on1;
    });
    if (size === 0) resolve();
  });
}
var id = 0;
function Transition(groups, parents, name, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function transition(name) {
  return selection_default().transition(name);
}
function newId() {
  return ++id;
}
var selection_prototype = selection_default.prototype;
Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: select_default3,
  selectAll: selectAll_default2,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: filter_default2,
  merge: merge_default2,
  selection: selection_default2,
  transition: transition_default,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: on_default2,
  attr: attr_default2,
  attrTween: attrTween_default,
  style: style_default2,
  styleTween: styleTween_default,
  text: text_default2,
  textTween: textTween_default,
  remove: remove_default2,
  tween: tween_default,
  delay: delay_default,
  duration: duration_default,
  ease: ease_default,
  easeVarying: easeVarying_default,
  end: end_default,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
var defaultTiming = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};
function inherit(node, id2) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id2])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m2 = groups.length, j = 0; j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule_default(node, name, id2, i, group, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}
selection_default.prototype.interrupt = interrupt_default2;
selection_default.prototype.transition = transition_default2;
var { abs, max: max2, min: min2 } = Math;
function number1(e) {
  return [+e[0], +e[1]];
}
function number2(e) {
  return [number1(e[0]), number1(e[1])];
}
var X = {
  name: "x",
  handles: ["w", "e"].map(type),
  input: function(x2, e) {
    return x2 == null ? null : [[+x2[0], e[0][1]], [+x2[1], e[1][1]]];
  },
  output: function(xy) {
    return xy && [xy[0][0], xy[1][0]];
  }
};
var Y = {
  name: "y",
  handles: ["n", "s"].map(type),
  input: function(y2, e) {
    return y2 == null ? null : [[e[0][0], +y2[0]], [e[1][0], +y2[1]]];
  },
  output: function(xy) {
    return xy && [xy[0][1], xy[1][1]];
  }
};
var XY = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
  input: function(xy) {
    return xy == null ? null : number2(xy);
  },
  output: function(xy) {
    return xy;
  }
};
function type(t) {
  return { type: t };
}
function center_default(x2, y2) {
  var nodes, strength = 1;
  if (x2 == null) x2 = 0;
  if (y2 == null) y2 = 0;
  function force() {
    var i, n = nodes.length, node, sx = 0, sy = 0;
    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }
    for (sx = (sx / n - x2) * strength, sy = (sy / n - y2) * strength, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }
  force.initialize = function(_) {
    nodes = _;
  };
  force.x = function(_) {
    return arguments.length ? (x2 = +_, force) : x2;
  };
  force.y = function(_) {
    return arguments.length ? (y2 = +_, force) : y2;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  return force;
}
function add_default(d) {
  const x2 = +this._x.call(null, d), y2 = +this._y.call(null, d);
  return add(this.cover(x2, y2), x2, y2, d);
}
function add(tree, x2, y2, d) {
  if (isNaN(x2) || isNaN(y2)) return tree;
  var parent, node = tree._root, leaf = { data: d }, x0 = tree._x0, y0 = tree._y0, x1 = tree._x1, y1 = tree._y1, xm, ym, xp, yp, right, bottom, i, j;
  if (!node) return tree._root = leaf, tree;
  while (node.length) {
    if (right = x2 >= (xm = (x0 + x1) / 2)) x0 = xm;
    else x1 = xm;
    if (bottom = y2 >= (ym = (y0 + y1) / 2)) y0 = ym;
    else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x2 === xp && y2 === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x2 >= (xm = (x0 + x1) / 2)) x0 = xm;
    else x1 = xm;
    if (bottom = y2 >= (ym = (y0 + y1) / 2)) y0 = ym;
    else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}
function addAll(data) {
  var d, i, n = data.length, x2, y2, xz = new Array(n), yz = new Array(n), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (i = 0; i < n; ++i) {
    if (isNaN(x2 = +this._x.call(null, d = data[i])) || isNaN(y2 = +this._y.call(null, d))) continue;
    xz[i] = x2;
    yz[i] = y2;
    if (x2 < x0) x0 = x2;
    if (x2 > x1) x1 = x2;
    if (y2 < y0) y0 = y2;
    if (y2 > y1) y1 = y2;
  }
  if (x0 > x1 || y0 > y1) return this;
  this.cover(x0, y0).cover(x1, y1);
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }
  return this;
}
function cover_default(x2, y2) {
  if (isNaN(x2 = +x2) || isNaN(y2 = +y2)) return this;
  var x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x2)) + 1;
    y1 = (y0 = Math.floor(y2)) + 1;
  } else {
    var z = x1 - x0 || 1, node = this._root, parent, i;
    while (x0 > x2 || x2 >= x1 || y0 > y2 || y2 >= y1) {
      i = (y2 < y0) << 1 | x2 < x0;
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0:
          x1 = x0 + z, y1 = y0 + z;
          break;
        case 1:
          x0 = x1 - z, y1 = y0 + z;
          break;
        case 2:
          x1 = x0 + z, y0 = y1 - z;
          break;
        case 3:
          x0 = x1 - z, y0 = y1 - z;
          break;
      }
    }
    if (this._root && this._root.length) this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}
function data_default2() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do
      data.push(node.data);
    while (node = node.next);
  });
  return data;
}
function extent_default(_) {
  return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0], [this._x1, this._y1]];
}
function quad_default(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}
function find_default(x2, y2, radius) {
  var data, x0 = this._x0, y0 = this._y0, x1, y1, x22, y22, x3 = this._x1, y3 = this._y1, quads = [], node = this._root, q, i;
  if (node) quads.push(new quad_default(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x2 - radius, y0 = y2 - radius;
    x3 = x2 + radius, y3 = y2 + radius;
    radius *= radius;
  }
  while (q = quads.pop()) {
    if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x22 = q.x1) < x0 || (y22 = q.y1) < y0) continue;
    if (node.length) {
      var xm = (x1 + x22) / 2, ym = (y1 + y22) / 2;
      quads.push(
        new quad_default(node[3], xm, ym, x22, y22),
        new quad_default(node[2], x1, ym, xm, y22),
        new quad_default(node[1], xm, y1, x22, ym),
        new quad_default(node[0], x1, y1, xm, ym)
      );
      if (i = (y2 >= ym) << 1 | x2 >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    } else {
      var dx = x2 - +this._x.call(null, node.data), dy = y2 - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x2 - d, y0 = y2 - d;
        x3 = x2 + d, y3 = y2 + d;
        data = node.data;
      }
    }
  }
  return data;
}
function remove_default3(d) {
  if (isNaN(x2 = +this._x.call(null, d)) || isNaN(y2 = +this._y.call(null, d))) return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1, x2, y2, xm, ym, right, bottom, i, j;
  if (!node) return this;
  if (node.length) while (true) {
    if (right = x2 >= (xm = (x0 + x1) / 2)) x0 = xm;
    else x1 = xm;
    if (bottom = y2 >= (ym = (y0 + y1) / 2)) y0 = ym;
    else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3]) retainer = parent, j = i;
  }
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;
  if (previous) return next ? previous.next = next : delete previous.next, this;
  if (!parent) return this._root = next, this;
  next ? parent[i] = next : delete parent[i];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }
  return this;
}
function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}
function root_default() {
  return this._root;
}
function size_default2() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do
      ++size;
    while (node = node.next);
  });
  return size;
}
function visit_default(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new quad_default(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new quad_default(child, x0, y0, xm, ym));
    }
  }
  return this;
}
function visitAfter_default(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new quad_default(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new quad_default(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}
function defaultX(d) {
  return d[0];
}
function x_default(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}
function defaultY(d) {
  return d[1];
}
function y_default(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}
function quadtree(nodes, x2, y2) {
  var tree = new Quadtree(x2 == null ? defaultX : x2, y2 == null ? defaultY : y2, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x2, y2, x0, y0, x1, y1) {
  this._x = x2;
  this._y = y2;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = void 0;
}
function leaf_copy(leaf) {
  var copy2 = { data: leaf.data }, next = copy2;
  while (leaf = leaf.next) next = next.next = { data: leaf.data };
  return copy2;
}
var treeProto = quadtree.prototype = Quadtree.prototype;
treeProto.copy = function() {
  var copy2 = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
  if (!node) return copy2;
  if (!node.length) return copy2._root = leaf_copy(node), copy2;
  nodes = [{ source: node, target: copy2._root = new Array(4) }];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({ source: child, target: node.target[i] = new Array(4) });
        else node.target[i] = leaf_copy(child);
      }
    }
  }
  return copy2;
};
treeProto.add = add_default;
treeProto.addAll = addAll;
treeProto.cover = cover_default;
treeProto.data = data_default2;
treeProto.extent = extent_default;
treeProto.find = find_default;
treeProto.remove = remove_default3;
treeProto.removeAll = removeAll;
treeProto.root = root_default;
treeProto.size = size_default2;
treeProto.visit = visit_default;
treeProto.visitAfter = visitAfter_default;
treeProto.x = x_default;
treeProto.y = y_default;
function constant_default5(x2) {
  return function() {
    return x2;
  };
}
function jiggle_default(random) {
  return (random() - 0.5) * 1e-6;
}
function index(d) {
  return d.index;
}
function find2(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("node not found: " + nodeId);
  return node;
}
function link_default(links) {
  var id2 = index, strength = defaultStrength, strengths, distance = constant_default5(30), distances, nodes, count, bias, random, iterations = 1;
  if (links == null) links = [];
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }
  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x2, y2, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x2 = target.x + target.vx - source.x - source.vx || jiggle_default(random);
        y2 = target.y + target.vy - source.y - source.vy || jiggle_default(random);
        l = Math.sqrt(x2 * x2 + y2 * y2);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x2 *= l, y2 *= l;
        target.vx -= x2 * (b = bias[i]);
        target.vy -= y2 * b;
        source.vx += x2 * (b = 1 - b);
        source.vy += y2 * b;
      }
    }
  }
  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, m2 = links.length, nodeById = new Map(nodes.map((d, i2) => [id2(d, i2, nodes), d])), link;
    for (i = 0, count = new Array(n); i < m2; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find2(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find2(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i = 0, bias = new Array(m2); i < m2; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }
    strengths = new Array(m2), initializeStrength();
    distances = new Array(m2), initializeDistance();
  }
  function initializeStrength() {
    if (!nodes) return;
    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }
  function initializeDistance() {
    if (!nodes) return;
    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };
  force.id = function(_) {
    return arguments.length ? (id2 = _, force) : id2;
  };
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default5(+_), initializeStrength(), force) : strength;
  };
  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant_default5(+_), initializeDistance(), force) : distance;
  };
  return force;
}
var a = 1664525;
var c = 1013904223;
var m = 4294967296;
function lcg_default() {
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}
function x(d) {
  return d.x;
}
function y(d) {
  return d.y;
}
var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));
function simulation_default(nodes) {
  var simulation, alpha = 1, alphaMin = 1e-3, alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), alphaTarget = 0, velocityDecay = 0.6, forces = /* @__PURE__ */ new Map(), stepper = timer(step), event = dispatch_default("tick", "end"), random = lcg_default();
  if (nodes == null) nodes = [];
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }
  function tick(iterations) {
    var i, n = nodes.length, node;
    if (iterations === void 0) iterations = 1;
    for (var k = 0; k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;
      forces.forEach(function(force) {
        force(alpha);
      });
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null) node.x += node.vx *= velocityDecay;
        else node.x = node.fx, node.vx = 0;
        if (node.fy == null) node.y += node.vy *= velocityDecay;
        else node.y = node.fy, node.vy = 0;
      }
    }
    return simulation;
  }
  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }
  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes, random);
    return force;
  }
  initializeNodes();
  return simulation = {
    tick,
    restart: function() {
      return stepper.restart(step), simulation;
    },
    stop: function() {
      return stepper.stop(), simulation;
    },
    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },
    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },
    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },
    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },
    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },
    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },
    randomSource: function(_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },
    force: function(name, _) {
      return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
    },
    find: function(x2, y2, radius) {
      var i = 0, n = nodes.length, dx, dy, d2, node, closest;
      if (radius == null) radius = Infinity;
      else radius *= radius;
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x2 - node.x;
        dy = y2 - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }
      return closest;
    },
    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}
function manyBody_default() {
  var nodes, node, random, alpha, strength = constant_default5(-30), strengths, distanceMin2 = 1, distanceMax2 = Infinity, theta2 = 0.81;
  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x, y).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }
  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node2;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node2 = nodes[i], strengths[node2.index] = +strength(node2, i, nodes);
  }
  function accumulate(quad) {
    var strength2 = 0, q, c2, weight = 0, x2, y2, i;
    if (quad.length) {
      for (x2 = y2 = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c2 = Math.abs(q.value))) {
          strength2 += q.value, weight += c2, x2 += c2 * q.x, y2 += c2 * q.y;
        }
      }
      quad.x = x2 / weight;
      quad.y = y2 / weight;
    } else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do
        strength2 += strengths[q.data.index];
      while (q = q.next);
    }
    quad.value = strength2;
  }
  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;
    var x3 = quad.x - node.x, y2 = quad.y - node.y, w = x2 - x1, l = x3 * x3 + y2 * y2;
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x3 === 0) x3 = jiggle_default(random), l += x3 * x3;
        if (y2 === 0) y2 = jiggle_default(random), l += y2 * y2;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x3 * quad.value * alpha / l;
        node.vy += y2 * quad.value * alpha / l;
      }
      return true;
    } else if (quad.length || l >= distanceMax2) return;
    if (quad.data !== node || quad.next) {
      if (x3 === 0) x3 = jiggle_default(random), l += x3 * x3;
      if (y2 === 0) y2 = jiggle_default(random), l += y2 * y2;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }
    do
      if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x3 * w;
        node.vy += y2 * w;
      }
    while (quad = quad.next);
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default5(+_), initialize(), force) : strength;
  };
  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };
  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };
  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };
  return force;
}
function radial_default(radius, x2, y2) {
  var nodes, strength = constant_default5(0.1), strengths, radiuses;
  if (typeof radius !== "function") radius = constant_default5(+radius);
  if (x2 == null) x2 = 0;
  if (y2 == null) y2 = 0;
  function force(alpha) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var node = nodes[i], dx = node.x - x2 || 1e-6, dy = node.y - y2 || 1e-6, r = Math.sqrt(dx * dx + dy * dy), k = (radiuses[i] - r) * strengths[i] * alpha / r;
      node.vx += dx * k;
      node.vy += dy * k;
    }
  }
  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    radiuses = new Array(n);
    for (i = 0; i < n; ++i) {
      radiuses[i] = +radius(nodes[i], i, nodes);
      strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function(_) {
    nodes = _, initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default5(+_), initialize(), force) : strength;
  };
  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant_default5(+_), initialize(), force) : radius;
  };
  force.x = function(_) {
    return arguments.length ? (x2 = +_, force) : x2;
  };
  force.y = function(_) {
    return arguments.length ? (y2 = +_, force) : y2;
  };
  return force;
}
function formatDecimal_default(x2) {
  return Math.abs(x2 = Math.round(x2)) >= 1e21 ? x2.toLocaleString("en").replace(/,/g, "") : x2.toString(10);
}
function formatDecimalParts(x2, p) {
  if ((i = (x2 = p ? x2.toExponential(p - 1) : x2.toExponential()).indexOf("e")) < 0) return null;
  var i, coefficient = x2.slice(0, i);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x2.slice(i + 1)
  ];
}
function exponent_default(x2) {
  return x2 = formatDecimalParts(Math.abs(x2)), x2 ? x2[1] : NaN;
}
function formatGroup_default(grouping, thousands) {
  return function(value, width) {
    var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}
function formatNumerals_default(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
function formatTrim_default(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".":
        i0 = i1 = i;
        break;
      case "0":
        if (i0 === 0) i0 = i;
        i1 = i;
        break;
      default:
        if (!+s[i]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}
var prefixExponent;
function formatPrefixAuto_default(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return x2 + "";
  var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x2, Math.max(0, p + i - 1))[0];
}
function formatRounded_default(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return x2 + "";
  var coefficient = d[0], exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}
var formatTypes_default = {
  "%": (x2, p) => (x2 * 100).toFixed(p),
  "b": (x2) => Math.round(x2).toString(2),
  "c": (x2) => x2 + "",
  "d": formatDecimal_default,
  "e": (x2, p) => x2.toExponential(p),
  "f": (x2, p) => x2.toFixed(p),
  "g": (x2, p) => x2.toPrecision(p),
  "o": (x2) => Math.round(x2).toString(8),
  "p": (x2, p) => formatRounded_default(x2 * 100, p),
  "r": formatRounded_default,
  "s": formatPrefixAuto_default,
  "X": (x2) => Math.round(x2).toString(16).toUpperCase(),
  "x": (x2) => Math.round(x2).toString(16)
};
function identity_default(x2) {
  return x2;
}
var map = Array.prototype.map;
var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function locale_default(locale2) {
  var group = locale2.grouping === void 0 || locale2.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale2.grouping, Number), locale2.thousands + ""), currencyPrefix = locale2.currency === void 0 ? "" : locale2.currency[0] + "", currencySuffix = locale2.currency === void 0 ? "" : locale2.currency[1] + "", decimal = locale2.decimal === void 0 ? "." : locale2.decimal + "", numerals = locale2.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale2.numerals, String)), percent = locale2.percent === void 0 ? "%" : locale2.percent + "", minus = locale2.minus === void 0 ? "\u2212" : locale2.minus + "", nan = locale2.nan === void 0 ? "NaN" : locale2.nan + "";
  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type2 = specifier.type;
    if (type2 === "n") comma = true, type2 = "g";
    else if (!formatTypes_default[type2]) precision === void 0 && (precision = 12), trim = true, type2 = "g";
    if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type2) ? "0" + type2.toLowerCase() : "", suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type2) ? percent : "";
    var formatType = formatTypes_default[type2], maybeSuffix = /[defgprs%]/.test(type2);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type2) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format2(value) {
      var valuePrefix = prefix, valueSuffix = suffix, i, n, c2;
      if (type2 === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;
        var valueNegative = value < 0 || 1 / value < 0;
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
        if (trim) value = formatTrim_default(value);
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;
        valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type2 === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c2 = value.charCodeAt(i), 48 > c2 || c2 > 57) {
              valueSuffix = (c2 === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }
      if (comma && !zero3) value = group(value, Infinity);
      var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
      if (comma && zero3) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format2.toString = function() {
      return specifier + "";
    };
    return format2;
  }
  function formatPrefix2(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)), e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), prefix = prefixes[8 + e / 3];
    return function(value2) {
      return f(k * value2) + prefix;
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}
var locale;
var format;
var formatPrefix;
defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function defaultLocale(definition) {
  locale = locale_default(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}
function precisionFixed_default(step) {
  return Math.max(0, -exponent_default(Math.abs(step)));
}
function precisionPrefix_default(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
}
function precisionRound_default(step, max3) {
  step = Math.abs(step), max3 = Math.abs(max3) - step;
  return Math.max(0, exponent_default(max3) - exponent_default(step)) + 1;
}
function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range).domain(domain);
      break;
  }
  return this;
}
function constants(x2) {
  return function() {
    return x2;
  };
}
function number3(x2) {
  return +x2;
}
var unit = [0, 1];
function identity2(x2) {
  return x2;
}
function normalize(a2, b) {
  return (b -= a2 = +a2) ? function(x2) {
    return (x2 - a2) / b;
  } : constants(isNaN(b) ? NaN : 0.5);
}
function clamper(a2, b) {
  var t;
  if (a2 > b) t = a2, a2 = b, b = t;
  return function(x2) {
    return Math.max(a2, Math.min(b, x2));
  };
}
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x2) {
    return r0(d0(x2));
  };
}
function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1, d = new Array(j), r = new Array(j), i = -1;
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }
  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }
  return function(x2) {
    var i2 = bisect_default(domain, x2, 1, j) - 1;
    return r[i2](d[i2](x2));
  };
}
function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer() {
  var domain = unit, range = unit, interpolate = value_default, transform2, untransform, unknown, clamp = identity2, piecewise, output, input;
  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity2) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }
  function scale(x2) {
    return x2 == null || isNaN(x2 = +x2) ? unknown : (output || (output = piecewise(domain.map(transform2), range, interpolate)))(transform2(clamp(x2)));
  }
  scale.invert = function(y2) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform2), number_default)))(y2)));
  };
  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number3), rescale()) : domain.slice();
  };
  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };
  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate = round_default, rescale();
  };
  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity2, rescale()) : clamp !== identity2;
  };
  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };
  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function(t, u) {
    transform2 = t, untransform = u;
    return rescale();
  };
}
function tickFormat(start2, stop, count, specifier) {
  var step = tickStep(start2, stop, count), precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start2), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start2), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}
function linearish(scale) {
  var domain = scale.domain;
  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };
  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };
  scale.nice = function(count) {
    if (count == null) count = 10;
    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start2 = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;
    if (stop < start2) {
      step = start2, start2 = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    while (maxIter-- > 0) {
      step = tickIncrement(start2, stop, count);
      if (step === prestep) {
        d[i0] = start2;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start2 = Math.floor(start2 / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start2 = Math.ceil(start2 * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }
    return scale;
  };
  return scale;
}
function transformPow(exponent) {
  return function(x2) {
    return x2 < 0 ? -Math.pow(-x2, exponent) : Math.pow(x2, exponent);
  };
}
function transformSqrt(x2) {
  return x2 < 0 ? -Math.sqrt(-x2) : Math.sqrt(x2);
}
function transformSquare(x2) {
  return x2 < 0 ? -x2 * x2 : x2 * x2;
}
function powish(transform2) {
  var scale = transform2(identity2, identity2), exponent = 1;
  function rescale() {
    return exponent === 1 ? transform2(identity2, identity2) : exponent === 0.5 ? transform2(transformSqrt, transformSquare) : transform2(transformPow(exponent), transformPow(1 / exponent));
  }
  scale.exponent = function(_) {
    return arguments.length ? (exponent = +_, rescale()) : exponent;
  };
  return linearish(scale);
}
function pow() {
  var scale = powish(transformer());
  scale.copy = function() {
    return copy(scale, pow()).exponent(scale.exponent());
  };
  initRange.apply(scale, arguments);
  return scale;
}
var constant_default6 = (x2) => () => x2;
function ZoomEvent(type2, {
  sourceEvent,
  target,
  transform: transform2,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type2, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    transform: { value: transform2, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
function Transform(k, x2, y2) {
  this.k = k;
  this.x = x2;
  this.y = y2;
}
Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x2, y2) {
    return x2 === 0 & y2 === 0 ? this : new Transform(this.k, this.x + this.k * x2, this.y + this.k * y2);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x2) {
    return x2 * this.k + this.x;
  },
  applyY: function(y2) {
    return y2 * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x2) {
    return (x2 - this.x) / this.k;
  },
  invertY: function(y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function(x2) {
    return x2.copy().domain(x2.range().map(this.invertX, this).map(x2.invert, x2));
  },
  rescaleY: function(y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity3 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
function transform(node) {
  while (!node.__zoom) if (!(node = node.parentNode)) return identity3;
  return node.__zoom;
}
function nopropagation3(event) {
  event.stopImmediatePropagation();
}
function noevent_default3(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function defaultFilter2(event) {
  return (!event.ctrlKey || event.type === "wheel") && !event.button;
}
function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}
function defaultTransform() {
  return this.__zoom || identity3;
}
function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 2e-3) * (event.ctrlKey ? 10 : 1);
}
function defaultTouchable2() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function defaultConstrain(transform2, extent, translateExtent) {
  var dx0 = transform2.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform2.invertX(extent[1][0]) - translateExtent[1][0], dy0 = transform2.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform2.invertY(extent[1][1]) - translateExtent[1][1];
  return transform2.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}
function zoom_default2() {
  var filter2 = defaultFilter2, extent = defaultExtent, constrain = defaultConstrain, wheelDelta = defaultWheelDelta, touchable = defaultTouchable2, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate = zoom_default, listeners = dispatch_default("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
  function zoom(selection2) {
    selection2.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  zoom.transform = function(collection, transform2, point, event) {
    var selection2 = collection.selection ? collection.selection() : collection;
    selection2.property("__zoom", defaultTransform);
    if (collection !== selection2) {
      schedule(collection, transform2, point, event);
    } else {
      selection2.interrupt().each(function() {
        gesture(this, arguments).event(event).start().zoom(null, typeof transform2 === "function" ? transform2.apply(this, arguments) : transform2).end();
      });
    }
  };
  zoom.scaleBy = function(selection2, k, p, event) {
    zoom.scaleTo(selection2, function() {
      var k0 = this.__zoom.k, k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p, event);
  };
  zoom.scaleTo = function(selection2, k, p, event) {
    zoom.transform(selection2, function() {
      var e = extent.apply(this, arguments), t0 = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p, p1 = t0.invert(p0), k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p, event);
  };
  zoom.translateBy = function(selection2, x2, y2, event) {
    zoom.transform(selection2, function() {
      return constrain(this.__zoom.translate(
        typeof x2 === "function" ? x2.apply(this, arguments) : x2,
        typeof y2 === "function" ? y2.apply(this, arguments) : y2
      ), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };
  zoom.translateTo = function(selection2, x2, y2, p, event) {
    zoom.transform(selection2, function() {
      var e = extent.apply(this, arguments), t = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity3.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x2 === "function" ? -x2.apply(this, arguments) : -x2,
        typeof y2 === "function" ? -y2.apply(this, arguments) : -y2
      ), e, translateExtent);
    }, p, event);
  };
  function scale(transform2, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform2.k ? transform2 : new Transform(k, transform2.x, transform2.y);
  }
  function translate(transform2, p0, p1) {
    var x2 = p0[0] - p1[0] * transform2.k, y2 = p0[1] - p1[1] * transform2.k;
    return x2 === transform2.x && y2 === transform2.y ? transform2 : new Transform(transform2.k, x2, y2);
  }
  function centroid(extent2) {
    return [(+extent2[0][0] + +extent2[1][0]) / 2, (+extent2[0][1] + +extent2[1][1]) / 2];
  }
  function schedule(transition2, transform2, point, event) {
    transition2.on("start.zoom", function() {
      gesture(this, arguments).event(event).start();
    }).on("interrupt.zoom end.zoom", function() {
      gesture(this, arguments).event(event).end();
    }).tween("zoom", function() {
      var that = this, args = arguments, g = gesture(that, args).event(event), e = extent.apply(that, args), p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point, w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]), a2 = that.__zoom, b = typeof transform2 === "function" ? transform2.apply(that, args) : transform2, i = interpolate(a2.invert(p).concat(w / a2.k), b.invert(p).concat(w / b.k));
      return function(t) {
        if (t === 1) t = b;
        else {
          var l = i(t), k = w / l[2];
          t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k);
        }
        g.zoom(null, t);
      };
    });
  }
  function gesture(that, args, clean) {
    return !clean && that.__zooming || new Gesture(that, args);
  }
  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }
  Gesture.prototype = {
    event: function(event) {
      if (event) this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform2) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform2.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch") this.touch0[1] = transform2.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch") this.touch1[1] = transform2.invert(this.touch1[0]);
      this.that.__zoom = transform2;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type2) {
      var d = select_default2(this.that).datum();
      listeners.call(
        type2,
        this.that,
        new ZoomEvent(type2, {
          sourceEvent: this.sourceEvent,
          target: zoom,
          type: type2,
          transform: this.that.__zoom,
          dispatch: listeners
        }),
        d
      );
    }
  };
  function wheeled(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var g = gesture(this, args).event(event), t = this.__zoom, k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))), p = pointer_default(event);
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    } else if (t.k === k) return;
    else {
      g.mouse = [p, t.invert(p)];
      interrupt_default(this);
      g.start();
    }
    noevent_default3(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));
    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter2.apply(this, arguments)) return;
    var currentTarget = event.currentTarget, g = gesture(this, args, true).event(event), v = select_default2(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p = pointer_default(event, currentTarget), x0 = event.clientX, y0 = event.clientY;
    nodrag_default(event.view);
    nopropagation3(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt_default(this);
    g.start();
    function mousemoved(event2) {
      noevent_default3(event2);
      if (!g.moved) {
        var dx = event2.clientX - x0, dy = event2.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event2).zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer_default(event2, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }
    function mouseupped(event2) {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event2.view, g.moved);
      noevent_default3(event2);
      g.event(event2).end();
    }
  }
  function dblclicked(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var t0 = this.__zoom, p0 = pointer_default(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t0.invert(p0), k1 = t0.k * (event.shiftKey ? 0.5 : 2), t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);
    noevent_default3(event);
    if (duration > 0) select_default2(this).transition().duration(duration).call(schedule, t1, p0, event);
    else select_default2(this).call(zoom.transform, t1, p0, event);
  }
  function touchstarted(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var touches = event.touches, n = touches.length, g = gesture(this, args, event.changedTouches.length === n).event(event), started, i, t, p;
    nopropagation3(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
    }
    if (touchstarting) touchstarting = clearTimeout(touchstarting);
    if (started) {
      if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() {
        touchstarting = null;
      }, touchDelay);
      interrupt_default(this);
      g.start();
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t, p, l;
    noevent_default3(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1], p1 = g.touch1[0], l1 = g.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
    else return;
    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }
  function touchended(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t;
    nopropagation3(event);
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
    }
    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      if (g.taps === 2) {
        t = pointer_default(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select_default2(this).on("dblclick.zoom");
          if (p) p.apply(this, arguments);
        }
      }
    }
  }
  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant_default6(+_), zoom) : wheelDelta;
  };
  zoom.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant_default6(!!_), zoom) : filter2;
  };
  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default6(!!_), zoom) : touchable;
  };
  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant_default6([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };
  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };
  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };
  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };
  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };
  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };
  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };
  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };
  zoom.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
  };
  return zoom;
}
async function build_html2(cluster_groups, opts = {}) {
  return `
    <div class="sc-clusters-visualizer-view" style="width: 100%; height: 100%;">
      <div class="sc-top-bar">
        <div class="sc-visualizer-actions">
          <button class="sc-pin" aria-label="Pin the network in place (disable physics)">
            <span class="sc-icon-pin">${this.get_icon_html?.("pin") || "\u{1F4CC}"}</span>
            <span class="sc-icon-pin-off" style="display:none;">${this.get_icon_html?.("pin-off") || "\u{1F4CD}"}</span>
            <span class="sc-button-label">Pin layout</span>
          </button>
          <button class="sc-create-cluster" aria-label="Create a new cluster with connections relative to the selected node(s)">
            ${this.get_icon_html?.("group") || "group"}
            <span class="sc-button-label">Create cluster</span>
          </button>
          <button class="sc-remove-from-cluster" aria-label="Ungroup the selected node(s) from the selected cluster">
            ${this.get_icon_html?.("ungroup") || "ungroup"}
            <span class="sc-button-label">Ungroup from cluster</span>
          </button>
          <!--
          <button class="sc-add-to-cluster" aria-label="Merge node(s) to cluster">
            ${this.get_icon_html?.("combine") || "combine"}
          </button>
          -->
          <button class="sc-add-to-cluster-center" aria-label="Add node(s) to cluster's center - Makes cluster connect to more notes like selection">
            ${this.get_icon_html?.("badge-plus") || "plus"}
            <span class="sc-button-label">Add to center</span>
          </button>
          <button class="sc-remove-cluster-center" aria-label="Remove node(s) from cluster's center - Make cluster connect to fewer notes like selection">
            ${this.get_icon_html?.("badge-minus") || "minus"}
            <span class="sc-button-label">Remove from center</span>
          </button>
          <button class="sc-remove-cluster" aria-label="Remove the selected cluster(s)">
            ${this.get_icon_html?.("badge-x") || "badge-x"}
            <span class="sc-button-label">Remove cluster(s)</span>
          </button>
          <button class="sc-refresh" aria-label="Refresh clusters visualization">
            ${this.get_icon_html?.("refresh-cw") || "\u27F3"}
            <span class="sc-button-label">Refresh viz</span>
          </button>
        </div>
      </div>

      <!-- Threshold slider row beneath top bar -->
      <div class="sc-threshold-row">
        <label for="threshold-slider" class="sc-threshold-label">
          Threshold: <span id="threshold-value">0.4</span>
        </label>
        <input
          type="range"
          id="threshold-slider"
          min="0"
          max="1"
          step="0.01"
          value="0.4"
          data-smart-setting="threshold"
        />
      </div>

      <div class="sc-visualizer-content" style="width: 100%; height: 100%;">
        <canvas
          class="clusters-visualizer-canvas"
          width="100%"
          height="100%"
          style="display:block;"
        >
        </canvas>
      </div>
    </div>
  `;
}
function findNodeAt(sx, sy, nodes, currentZoom, expandThreshold = 3) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.type === "center" && currentZoom < expandThreshold) {
      continue;
    }
    const dx = sx - node.x;
    const dy = sy - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) {
      return node;
    }
  }
  return null;
}
async function render2(view, opts = {}) {
  let debug = !!opts.debug;
  if (debug) console.log("render() called with:", view.env.cluster_groups);
  const cluster_groups = view.env.cluster_groups;
  const cluster_group = Object.values(cluster_groups.items).sort((a2, b) => b.key.localeCompare(a2.key))[0];
  if (!cluster_group) {
    return this.create_doc_fragment("<div>No cluster group found!</div>");
  }
  const snapshot = await cluster_group.get_snapshot(
    Object.values(cluster_groups.env.smart_sources.items)
  );
  const { clusters, members } = snapshot;
  if (debug) {
    console.log("clusters:", clusters);
    console.log("members:", members);
    const simon_member = members.find(
      (member) => getLastSegmentWithoutExtension(member.item.key) === "Simon"
    );
    console.log("simon_member:", simon_member);
  }
  const html = await build_html2.call(this, cluster_groups, opts);
  const frag = this.create_doc_fragment(html);
  const pinBtn = frag.querySelector(".sc-pin");
  const createClusterBtn = frag.querySelector(".sc-create-cluster");
  const addToClusterBtn = frag.querySelector(".sc-add-to-cluster");
  const addToClusterCenterBtn = frag.querySelector(".sc-add-to-cluster-center");
  const removeFromClusterCenterBtn = frag.querySelector(".sc-remove-cluster-center");
  const removeClusterBtn = frag.querySelector(".sc-remove-cluster");
  const removeFromClusterBtn = frag.querySelector(".sc-remove-from-cluster");
  function showButton(btn, doShow) {
    if (!btn) return;
    btn.style.display = doShow ? "inline-flex" : "none";
  }
  function updateToolbarUI() {
    showButton(createClusterBtn, false);
    showButton(removeFromClusterBtn, false);
    showButton(addToClusterCenterBtn, false);
    showButton(removeFromClusterCenterBtn, false);
    showButton(removeClusterBtn, false);
    if (debug) console.log("selectedNodes: ", selectedNodes);
    if (selectedNodes.size === 0) {
      return;
    }
    let memberCount = 0;
    let clusterCount = 0;
    let centerCount = 0;
    for (const node of selectedNodes) {
      if (node.type === "member") memberCount++;
      else if (node.type === "cluster") clusterCount++;
      else if (node.type === "center") centerCount++;
    }
    if (debug) {
      console.log("memberCount: ", memberCount);
      console.log("cluster count: ", clusterCount);
      console.log("center count: ", centerCount);
    }
    const onlyMembers = memberCount > 0 && clusterCount === 0 && centerCount === 0;
    const onlyCenter = centerCount > 0 && memberCount === 0 && clusterCount === 0;
    const onlyCluster = clusterCount > 0 && memberCount === 0 && centerCount === 0;
    if (onlyMembers) {
      showButton(createClusterBtn, true);
    }
    if (memberCount > 0 && clusterCount === 1) {
      showButton(removeFromClusterBtn, true);
      showButton(addToClusterCenterBtn, true);
    }
    if (onlyCenter) {
      showButton(removeFromClusterCenterBtn, true);
      showButton(removeFromClusterBtn, true);
    }
    if (onlyCluster) {
      showButton(removeClusterBtn, true);
    }
  }
  this.add_settings_listeners(cluster_group, frag);
  const canvas_el = frag.querySelector(".clusters-visualizer-canvas");
  if (!canvas_el) {
    console.warn("No <canvas> element found!");
    return frag;
  }
  const context = canvas_el.getContext("2d");
  const container_el = frag.querySelector(".sc-visualizer-content");
  function resizeCanvas() {
    const { width, height } = container_el.getBoundingClientRect();
    canvas_el.width = width;
    canvas_el.height = height;
    ticked();
  }
  requestAnimationFrame(() => {
    setTimeout(() => {
      resizeCanvas();
      centerNetwork();
      ticked();
    }, 0);
  });
  function centerNetwork() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    nodes.forEach((d) => {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
      if (d.y < minY) minY = d.y;
      if (d.y > maxY) maxY = d.y;
    });
    const w = canvas_el.width;
    const h = canvas_el.height;
    const networkWidth = maxX - minX;
    const networkHeight = maxY - minY;
    if (networkWidth === 0 || networkHeight === 0) {
      transform2 = identity3.translate(w / 2, h / 2).scale(1);
    } else {
      const padding = 0.1;
      const scale = (1 - padding) / Math.max(networkWidth / w, networkHeight / h);
      const midX = (maxX + minX) / 2;
      const midY = (maxY + minY) / 2;
      transform2 = identity3.translate(w / 2, h / 2).scale(scale).translate(-midX, -midY);
    }
    select_default2(canvas_el).call(zoom_behavior.transform, transform2);
  }
  const slider = frag.querySelector("#threshold-slider");
  const thresholdValueSpan = frag.querySelector("#threshold-value");
  if (slider) {
    slider.value = cluster_group.settings?.threshold || slider.value;
    let debounceTimeout;
    slider.addEventListener("input", (event) => {
      const threshold = parseFloat(slider.value);
      if (thresholdValueSpan) {
        thresholdValueSpan.textContent = threshold.toFixed(2);
      }
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateLinks(threshold);
        centerNetwork();
        cluster_group.queue_save();
      }, 100);
    });
  } else {
    console.error("Slider element not found!");
  }
  function updateLinks(threshold) {
    const newLinks = [];
    members.forEach((member) => {
      const member_key = member.item?.key || "unknown-member";
      Object.entries(member.clusters).forEach(([cl_id, cl_data]) => {
        const { score } = cl_data;
        if (score >= threshold && node_map[cl_id]) {
          const existingLink = links.find(
            (link) => link.source.id === cl_id && link.target.id === member_key
          );
          newLinks.push({
            source: cl_id,
            target: member_key,
            score,
            stroke: existingLink?.stroke || "#4c7787",
            currentAlpha: existingLink?.currentAlpha || 1
          });
        }
      });
    });
    links.length = 0;
    links.push(...newLinks);
    simulation.force(
      "link",
      link_default(links).id((d) => d.id).distance(
        (link) => typeof link.score === "number" ? distance_scale(link.score) : 200
      )
    ).force("center", center_default(0, 0)).force("radial", radial_default(100, 0, 0).strength(0.05));
    simulation.alpha(1).restart();
  }
  const nodes = [];
  const links = [];
  const node_map = {};
  function getLastSegmentWithoutExtension(fullPath) {
    const segments = fullPath.split("/");
    const lastSegment = segments[segments.length - 1];
    return lastSegment.replace(/\.[^/.]+$/, "");
  }
  clusters.forEach((cluster) => {
    const childCount = Array.isArray(cluster.centers) ? cluster.centers.length : 0;
    const baseRadius = 20;
    const growthFactor = 3;
    const maxRadius = 70;
    const scaledRadius = Math.min(baseRadius + childCount * growthFactor, maxRadius);
    const c_node = {
      id: cluster.key,
      type: "cluster",
      color: "#926ec9",
      radius: scaledRadius,
      cluster,
      children: []
    };
    nodes.push(c_node);
    node_map[cluster.key] = c_node;
    if (childCount > 0) {
      cluster.centers.forEach((item, i2) => {
        const angle = i2 / childCount * 2 * Math.PI;
        const dist = scaledRadius * 0.7;
        const childNode = {
          id: `${item.key}`,
          type: "center",
          color: "#d092c9",
          radius: 4,
          parent: c_node,
          cluster,
          item,
          offsetAngle: angle,
          offsetDist: dist
        };
        nodes.push(childNode);
        c_node.children.push(childNode);
      });
    }
  });
  if (debug) console.log("clusters 2: ", clusters);
  members.forEach((member) => {
    const member_key = member.item?.key || "unknown-member";
    const isAlreadyInCluster = node_map[member_key] !== void 0;
    const isAlreadyCenter = nodes.some((n) => n.id === member_key && n.type === "center");
    if (!isAlreadyInCluster && !isAlreadyCenter) {
      node_map[member_key] = {
        id: member_key,
        type: "member",
        color: "#7c8594",
        radius: 7,
        item: member.item
      };
      nodes.push(node_map[member_key]);
    }
    Object.entries(member.clusters).forEach(([cl_id, cl_data]) => {
      const { score } = cl_data;
      const threshold = cluster_group.settings?.threshold || 0.6;
      if (score >= threshold && node_map[cl_id]) {
        links.push({
          source: cl_id,
          target: member_key,
          score,
          stroke: "#4c7787"
        });
      }
    });
  });
  const all_scores = links.filter((l) => typeof l.score === "number").map((l) => l.score);
  const min_score = min(all_scores) ?? 0.6;
  const max_score = max(all_scores) ?? 1;
  const distance_scale = pow().exponent(2.5).domain([min_score, max_score]).range([400, 40]).clamp(true);
  const simulation = simulation_default(nodes).velocityDecay(0.9).force("charge", manyBody_default().strength(-400)).force(
    "link",
    link_default(links).id((d) => d.id).distance(
      (link) => typeof link.score === "number" ? distance_scale(link.score) : 200
    )
  ).force("childToParent", manyBody_default().strength(0)).on("tick", ticked);
  let i = 0;
  const max_iter = opts.max_alpha_iterations || 100;
  while (simulation.alpha() > 0.1 && i < max_iter) {
    simulation.tick();
    i++;
  }
  simulation.alphaTarget(0).restart();
  if (debug) {
    console.log(`Pre-run after ${i} ticks, alpha=${simulation.alpha()}`);
  }
  let transform2 = identity3;
  let pinned = false;
  const zoom_behavior = zoom_default2().scaleExtent([0.1, 10]).filter((event) => {
    if (event.shiftKey) return false;
    const [mx, my] = pointer_default(event, canvas_el);
    const [sx, sy] = transform2.invert([mx, my]);
    const node = findNodeAt(sx, sy, nodes, transform2.k);
    return !node;
  }).on("zoom", (event) => {
    transform2 = event.transform;
    ticked();
  });
  select_default2(canvas_el).call(zoom_behavior);
  let dragStartPos = null;
  let nodeStartPositions = /* @__PURE__ */ new Map();
  let isDragging = false;
  const drag_behavior = drag_default().clickDistance(5).subject((event) => {
    const [mx, my] = pointer_default(event, canvas_el);
    const [sx, sy] = transform2.invert([mx, my]);
    return findNodeAt(sx, sy, nodes, transform2.k) || null;
  }).on("start", (event) => {
    const node = event.subject;
    if (!node) return;
    isDragging = true;
    hoveredNode = null;
    if (pinned) {
      node.fx = null;
      node.fy = null;
    }
    if (!event.active) simulation.alphaTarget(0.1).restart();
    const [mx, my] = pointer_default(event, canvas_el);
    const [sx, sy] = transform2.invert([mx, my]);
    dragStartPos = [sx, sy];
    if (selectedNodes.has(node)) {
      nodeStartPositions.clear();
      selectedNodes.forEach((sn) => {
        nodeStartPositions.set(sn, { x: sn.x, y: sn.y });
      });
    } else {
      nodeStartPositions.clear();
      nodeStartPositions.set(node, { x: node.x, y: node.y });
    }
  }).on("drag", (event) => {
    if (!dragStartPos) return;
    const [mx, my] = pointer_default(event, canvas_el);
    const [sx, sy] = transform2.invert([mx, my]);
    const dx = sx - dragStartPos[0];
    const dy = sy - dragStartPos[1];
    nodeStartPositions.forEach((startPos, n) => {
      n.fx = startPos.x + dx;
      n.fy = startPos.y + dy;
    });
  }).on("end", (event) => {
    const node = event.subject;
    if (!node) return;
    if (!event.active) simulation.alphaTarget(0);
    if (pinned) {
      nodeStartPositions.forEach((_, n) => {
        n.fx = n.x;
        n.fy = n.y;
      });
    } else {
      nodeStartPositions.forEach((_, n) => {
        n.fx = null;
        n.fy = null;
      });
    }
    dragStartPos = null;
    nodeStartPositions.clear();
    isDragging = false;
  });
  select_default2(canvas_el).call(drag_behavior);
  let hoveredNode = null;
  const selectedNodes = /* @__PURE__ */ new Set();
  updateToolbarUI();
  let isSelecting = false;
  let selectionStart = null;
  let selectionEnd = null;
  function updateSelection(isShiftKey) {
    if (!selectionStart || !selectionEnd) return;
    const [x0, y0] = selectionStart;
    const [x1, y1] = selectionEnd;
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    const inBox = [];
    nodes.forEach((node) => {
      const { x: x2, y: y2 } = node;
      if (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY) {
        inBox.push(node);
      }
    });
    if (isShiftKey) {
      inBox.forEach((node) => selectedNodes.add(node));
    } else {
      selectedNodes.clear();
      inBox.forEach((node) => selectedNodes.add(node));
    }
  }
  select_default2(canvas_el).on("mousedown", (event) => {
    if (event.shiftKey) {
      isSelecting = true;
      const [mx, my] = pointer_default(event, canvas_el);
      selectionStart = transform2.invert([mx, my]);
      selectionEnd = selectionStart;
      ticked();
    }
  }).on("mousemove", (event) => {
    if (isDragging) {
      return;
    }
    if (isSelecting) {
      const [mx, my] = pointer_default(event, canvas_el);
      selectionEnd = transform2.invert([mx, my]);
      ticked();
    } else {
      const [mx, my] = pointer_default(event, canvas_el);
      const [sx, sy] = transform2.invert([mx, my]);
      hoveredNode = findNodeAt(sx, sy, nodes, transform2.k);
      canvas_el.style.cursor = hoveredNode ? "pointer" : "default";
      ticked();
    }
  }).on("mouseup", (event) => {
    if (isSelecting) {
      isSelecting = false;
      updateSelection(event.shiftKey);
      updateToolbarUI();
      ticked();
    }
  }).on("click", (event) => {
    let hover_preview_elm = document.querySelector(".popover.hover-popover > *");
    if (hover_preview_elm) {
      const mousemove_event = new MouseEvent("mousemove", {
        clientX: event.clientX + 1e3,
        clientY: event.clientY + 1e3,
        pageX: event.pageX + 1e3,
        pageY: event.pageY + 1e3,
        fromElement: event.target,
        bubbles: true
      });
      event.target.dispatchEvent(mousemove_event);
    }
    if (isSelecting) return;
    const [mx, my] = pointer_default(event, canvas_el);
    const [sx, sy] = transform2.invert([mx, my]);
    const clickedNode = findNodeAt(sx, sy, nodes, transform2.k);
    if (event.shiftKey) {
      if (clickedNode) {
        if (selectedNodes.has(clickedNode)) {
          selectedNodes.delete(clickedNode);
        } else {
          selectedNodes.add(clickedNode);
        }
      }
    } else {
      selectedNodes.clear();
      if (clickedNode) {
        selectedNodes.add(clickedNode);
        if (clickedNode.item?.path) {
          view.app.workspace.trigger("hover-link", {
            event,
            source: view.constructor.view_type,
            hoverParent: event.target,
            targetEl: event.target,
            linktext: clickedNode.item.path
          });
        }
      }
    }
    updateToolbarUI();
    ticked();
  });
  function ticked() {
    const w = canvas_el.width;
    const h = canvas_el.height;
    context.clearRect(0, 0, w, h);
    context.save();
    context.translate(transform2.x, transform2.y);
    context.scale(transform2.k, transform2.k);
    nodes.forEach((node) => {
      if (node.type === "center") {
        node.x = node.parent.x + node.offsetDist * Math.cos(node.offsetAngle);
        node.y = node.parent.y + node.offsetDist * Math.sin(node.offsetAngle);
        node.fx = node.x;
        node.fy = node.y;
      }
    });
    const connectedNodes = /* @__PURE__ */ new Set();
    const connectedLinks = /* @__PURE__ */ new Set();
    if (hoveredNode) {
      connectedNodes.add(hoveredNode);
      links.forEach((link) => {
        if (link.source === hoveredNode || link.target === hoveredNode) {
          connectedLinks.add(link);
          connectedNodes.add(link.source);
          connectedNodes.add(link.target);
        }
      });
    }
    links.forEach((link) => {
      link.desiredAlpha = hoveredNode ? connectedLinks.has(link) ? 1 : 0.05 : 1;
      link.currentAlpha = link.currentAlpha || link.desiredAlpha;
      link.currentAlpha += (link.desiredAlpha - link.currentAlpha) * 0.15;
      context.beginPath();
      context.strokeStyle = `rgba(76,119,135,${link.currentAlpha})`;
      context.lineWidth = link.currentAlpha > 0.5 ? 1.2 : 1;
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
      context.stroke();
    });
    nodes.forEach((node) => {
      node.desiredAlpha = hoveredNode ? connectedNodes.has(node) ? 1 : 0.1 : 1;
      node.currentAlpha = node.currentAlpha || node.desiredAlpha;
      node.currentAlpha += (node.desiredAlpha - node.currentAlpha) * 0.15;
      context.beginPath();
      if (node.type === "cluster") {
        if (transform2.k < 3) {
          context.fillStyle = hexToRgba(node.color, node.currentAlpha);
          context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          context.fill();
          if (selectedNodes.has(node)) {
            context.lineWidth = 3;
            context.strokeStyle = "#ff9800";
            context.stroke();
          }
        } else {
          context.fillStyle = hexToRgba(node.color, 0.5);
          context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          context.fill();
        }
      } else if (node.type === "center") {
        if (transform2.k >= 3) {
          context.fillStyle = hexToRgba(node.color, node.currentAlpha);
          context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          context.fill();
          if (selectedNodes.has(node)) {
            context.lineWidth = 3;
            context.strokeStyle = "#ff9800";
            context.stroke();
          }
        }
      } else {
        context.fillStyle = hexToRgba(node.color, node.currentAlpha);
        context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        context.fill();
        if (selectedNodes.has(node)) {
          context.lineWidth = 3;
          context.strokeStyle = "#ff9800";
          context.stroke();
        }
      }
    });
    if (isSelecting && selectionStart && selectionEnd) {
      context.beginPath();
      context.strokeStyle = "#009688";
      context.lineWidth = 1.5;
      const [x0, y0] = selectionStart;
      const [x1, y1] = selectionEnd;
      context.rect(x0, y0, x1 - x0, y1 - y0);
      context.stroke();
    }
    if (hoveredNode) {
      context.beginPath();
      context.fillStyle = "#ccc";
      context.font = "10px sans-serif";
      context.textAlign = "center";
      let labelText = hoveredNode.id;
      if (hoveredNode.type === "cluster") {
        labelText = getLastSegmentWithoutExtension(hoveredNode.cluster?.name) || hoveredNode.id;
      } else if (hoveredNode.type === "member") {
        labelText = getLastSegmentWithoutExtension(hoveredNode.item?.key) || hoveredNode.id;
      } else if (hoveredNode.type === "center") {
        labelText = getLastSegmentWithoutExtension(hoveredNode.id) || hoveredNode.id;
      }
      context.fillText(
        labelText,
        hoveredNode.x,
        hoveredNode.y - hoveredNode.radius - 4
      );
    }
    context.restore();
  }
  function hexToRgba(hex2, alpha = 1) {
    if (!/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex2)) {
      return `rgba(0,0,0,${alpha})`;
    }
    hex2 = hex2.slice(1);
    if (hex2.length === 3) {
      hex2 = hex2.split("").map((ch) => ch + ch).join("");
    }
    const r = parseInt(hex2.substr(0, 2), 16);
    const g = parseInt(hex2.substr(2, 2), 16);
    const b = parseInt(hex2.substr(4, 2), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  pinBtn?.addEventListener("click", () => {
    pinned = !pinned;
    const pinIcon = pinBtn.querySelector(".sc-icon-pin");
    const pinOffIcon = pinBtn.querySelector(".sc-icon-pin-off");
    if (pinned) {
      simulation.alpha(0).alphaTarget(0);
      nodes.forEach((n) => {
        n.fx = n.x;
        n.fy = n.y;
        n.vx = 0;
        n.vy = 0;
      });
      pinIcon.style.display = "none";
      pinOffIcon.style.display = "inline";
    } else {
      nodes.forEach((n) => {
        n.fx = null;
        n.fy = null;
        n.vx = 0;
        n.vy = 0;
      });
      simulation.alpha(0.8).restart();
      pinIcon.style.display = "inline";
      pinOffIcon.style.display = "none";
    }
  });
  createClusterBtn?.addEventListener("click", async () => {
    if (debug) console.log("Create new cluster from selection");
    const center = Array.from(selectedNodes.values()).reduce((acc, node) => {
      acc[node.item.key] = { weight: 1 };
      return acc;
    }, {});
    const cluster = await cluster_group.env.clusters.create_or_update({ center });
    await cluster_group.add_cluster(cluster);
    view.render_view();
  });
  addToClusterCenterBtn?.addEventListener("click", async () => {
    if (debug) console.log("Move node(s) to cluster center");
    const { items, cluster } = Array.from(selectedNodes.values()).reduce(
      (acc, node) => {
        if (node.type === "member") {
          acc.items.push(node.item);
        } else if (node.type === "cluster") {
          acc.cluster = node.cluster;
        }
        return acc;
      },
      { items: [], cluster: null }
    );
    if (debug) console.log("items:", items);
    await cluster.add_centers(items);
    view.render_view();
  });
  removeFromClusterCenterBtn?.addEventListener("click", async () => {
    if (debug) console.log("Remove node(s) from cluster center");
    const nodesArr = Array.from(selectedNodes.values());
    if (!nodesArr.length) return;
    const parentNode = nodesArr[0].parent;
    const parentCluster = parentNode?.cluster;
    if (!parentCluster) {
      console.warn("No parent cluster found for the selected nodes!");
      return;
    }
    const centerItems = nodesArr.map((node) => node.item);
    await parentCluster.remove_centers(centerItems);
    view.render_view();
  });
  removeClusterBtn?.addEventListener("click", async () => {
    if (debug) console.log("Remove node(s) from cluster(s)");
    const clArr = Array.from(selectedNodes.values()).map((node) => node.cluster);
    if (debug) console.log("clusters removed:", clArr);
    await cluster_group.remove_clusters(clArr);
    view.render_view();
  });
  removeFromClusterBtn?.addEventListener("click", async (e) => {
    if (debug) console.log("Ungroup selected node(s) from cluster");
    const { items, cluster } = Array.from(selectedNodes.values()).reduce(
      (acc, node) => {
        if (node.type === "member") {
          acc.items.push(node.item);
        } else if (node.type === "cluster") {
          acc.cluster = node.cluster;
        }
        return acc;
      },
      { items: [], cluster: null }
    );
    await cluster.remove_members(items);
    view.render_view();
  });
  return await post_process2.call(this, view, frag, opts);
}
async function post_process2(view, frag, opts = {}) {
  const refresh_btn = frag.querySelector(".sc-refresh");
  if (refresh_btn) {
    refresh_btn.addEventListener("click", () => {
      view.render_view();
    });
  }
  const help_btn = frag.querySelector(".sc-help");
  if (help_btn) {
    help_btn.addEventListener("click", () => {
      window.open("https://docs.smartconnections.app/clusters#visualizer", "_blank");
    });
  }
  return frag;
}

// center_select_modal.js
var import_obsidian2 = require("obsidian");
var CenterSelectModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.env = plugin.env;
    this.selected_items = [];
    this.setInstructions([
      { command: "Enter", purpose: "Add to context" },
      {
        command: "Ctrl+Enter",
        purpose: "Open visualizer using current selection"
      },
      { command: "Esc", purpose: "Close" }
    ]);
    this.submit_btn_text = "Select cluster centers";
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && import_obsidian2.Keymap.isModEvent(e)) {
        e.preventDefault();
        this.submit();
      }
    });
  }
  onOpen() {
    super.onOpen();
    if (this.current_input) {
      this.inputEl.value = this.current_input;
    }
    this.render_pills();
    this.inputEl.addEventListener("blur", () => {
      this.inputEl.focus();
    });
  }
  getItems() {
    return Object.keys(this.plugin.env.smart_sources.items).filter((key) => {
      return !this.selected_items.includes(key);
    });
  }
  getItemText(key) {
    return key;
  }
  onChooseItem(key) {
    this.current_input = this.inputEl.value;
    console.log("modal", this);
    this.selected_items.push(key);
    this.render_pills();
    this.open();
  }
  /**
   * Render the pill elements for each selected item.
   */
  render_pills() {
    console.log("render_pills", this.selected_items);
    if (this.submit_btn) {
      this.submit_btn.remove();
    }
    this.submit_btn = this.containerEl.createEl("button", { text: this.submit_btn_text });
    this.submit_btn.addEventListener("click", () => {
      this.submit();
    });
    if (this.modalEl && this.submit_btn) {
      this.modalEl.prepend(this.submit_btn);
    }
    if (this.selected_container_el) {
      this.selected_container_el.remove();
    }
    this.selected_container_el = this.containerEl.createDiv("sc-selected-pill-container");
    if (this.modalEl && this.selected_container_el) {
      this.modalEl.prepend(this.selected_container_el);
    }
    for (const sel of this.selected_items) {
      const pill = this.selected_container_el.createDiv("sc-selected-pill");
      pill.createSpan({ text: sel.split("/").pop() });
      const remove_el = pill.createSpan({
        text: "  \u2715",
        cls: "sc-selected-pill-remove"
      });
      remove_el.addEventListener("click", () => {
        this.selected_items = this.selected_items.filter((x2) => x2 !== sel);
        this.render_pills();
      });
      (0, import_obsidian2.setIcon)(pill.createSpan({ cls: "sc-selected-pill-icon" }), "document");
    }
  }
  async submit() {
    await this.env.cluster_groups.create_group(this.selected_items);
    this.close();
    this.plugin.open_cluster_visualizer();
    this.plugin.get_cluster_visualizer_view()?.render_view();
  }
};

// plugin.js
var SmartVisualizerPlugin = class extends import_obsidian3.Plugin {
  /**
   * @type {Object}
   */
  smart_env_config = {
    collections: {
      clusters: {
        class: Clusters,
        data_adapter: ajson_single_file_default
      },
      cluster_groups: {
        class: ClusterGroups,
        data_adapter: ajson_single_file_default
      }
    },
    item_types: {
      Cluster,
      ClusterGroup
    },
    components: {
      clusters_visualizer: render2
    }
  };
  /**
   * Called by Obsidian when the plugin is first loaded.
   * Registers the Smart Visualizer view and commands.
   */
  onload() {
    SmartEnv.create(this, {
      global_prop: "smart_env",
      collections: {},
      item_types: {},
      modules: {},
      ...this.smart_env_config
    });
    this.addCommand({
      id: "open-smart-vault-visualizer-view",
      name: "Open smart vault visualizer view",
      callback: () => {
        ClustersVisualizerView.open(this.app.workspace);
      }
    });
    this.addCommand({
      id: "open-center-select-modal",
      name: "Select cluster centers",
      callback: () => {
        const modal = new CenterSelectModal(this.app, this);
        modal.open();
      }
    });
    this.registerView(ClustersVisualizerView.view_type, (leaf) => new ClustersVisualizerView(leaf, this));
    this.addRibbonIcon("git-fork", "Open smart connections visualizer", (evt) => {
      this.open_connections_visualizer();
    });
    this.app.workspace.onLayoutReady(this.initialize.bind(this));
  }
  async initialize() {
    await SmartEnv.wait_for({ loaded: true });
  }
  open_connections_visualizer() {
    ClustersVisualizerView.open(this.app.workspace);
  }
  /**
   * Called by Obsidian when the plugin is unloaded.
   */
  onunload() {
    if (this.env) {
      this.env?.unload_main("smart_visualizer_plugin");
      this.env._components = {};
    }
    console.log("unloaded smart_visualizer_plugin");
  }
  open_cluster_visualizer() {
    ClustersVisualizerView.open(this.app.workspace);
  }
  get_cluster_visualizer_view() {
    return ClustersVisualizerView.get_view(this.app.workspace);
  }
};
var plugin_default = SmartVisualizerPlugin;


/* nosourcemap */