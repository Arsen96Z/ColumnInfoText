import { IInputs, IOutputs } from "./generated/ManifestTypes";

/** ColumnInfoText reference-only starter config (EXAMPLE_CONFIG). Copy into configJson or the anchor column. Never parsed by the control. */
const EXAMPLE_CONFIG = `{
  "fields": [
    {
      "field": "new_choice",
      "type": "choice",
      "dedupe": true,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": 1,
          "info": "Option A description",
          "background": "#FDE7E9",
          "textColor": "#A4262C",
          "wrap": false,
          "maxLength": 60
        }
      ]
    },
    {
      "field": "new_multiselect",
      "type": "multiselect",
      "dedupe": false,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": 1,
          "info": "First selection",
          "background": "#EFF6FC",
          "textColor": "#005A9E"
        },
        {
          "value": 2,
          "info": "Second selection",
          "background": "#DFF6DD",
          "textColor": "#107C10"
        }
      ]
    },
    {
      "field": "new_bool",
      "dedupe": false,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": 1,
          "info": "Yes — approved",
          "background": "#DFF6DD",
          "textColor": "#107C10"
        },
        {
          "value": 0,
          "info": "No — not approved",
          "background": "#F3F2F1",
          "textColor": "#605E5C"
        }
      ]
    },
    {
      "field": "new_text",
      "type": "text",
      "dedupe": false,
      "wrap": true,
      "maxLength": 120,
      "options": [
        {
          "value": "urgent",
          "info": "Notify manager immediately",
          "background": "#FDE7E9",
          "textColor": "#A4262C"
        }
      ]
    },
    {
      "field": "new_num",
      "type": "number",
      "dedupe": false,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": 0.5,
          "info": "Below minimum threshold",
          "background": "#EFF6FC",
          "textColor": "#005A9E"
        }
      ]
    },
    {
      "field": "new_money",
      "type": "currency",
      "dedupe": false,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": 1000,
          "info": "Tier 1 pricing applies",
          "background": "#EFF6FC",
          "textColor": "#005A9E"
        }
      ]
    },
    {
      "field": "new_date",
      "type": "date",
      "dedupe": false,
      "wrap": true,
      "maxLength": 0,
      "options": [
        {
          "value": "2026-06-22",
          "info": "Go-live date — coordinate rollout",
          "background": "#FFF4CE",
          "textColor": "#835C00"
        }
      ]
    }
  ]
}`;

const SECTION_ITEM = (name: string): string =>
    '[data-id="' + name + '-FieldSectionItemContainer"]';
const INFO_ID = (name: string): string => "cht-info-" + name;
const MOUNT_HIDE_STYLE_ID = "cht-hide-mount";

function installMountHideStyle(logicalName: string): void {
    if (document.getElementById(MOUNT_HIDE_STYLE_ID)) {
        return;
    }
    const styleEl = document.createElement("style");
    styleEl.id = MOUNT_HIDE_STYLE_ID;
    styleEl.textContent =
        '[data-id="' +
        logicalName +
        '"]{height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}' +
        '[data-id="' +
        logicalName +
        '-FieldSectionItemContainer"]{height:0!important;min-height:0!important;overflow:hidden!important;}';
    document.head.appendChild(styleEl);
}

function removeMountHideStyle(): void {
    const el = document.getElementById(MOUNT_HIDE_STYLE_ID);
    if (el) {
        el.remove();
    }
}

interface XrmPageUi {
    tabs: { get(): XrmTab[] };
    getFormType?(): number;
}

interface OptionEntry {
    value: string | number;
    info: string;
    background?: string;
    textColor?: string;
    wrap?: boolean;
    maxLength?: number;
}

interface FieldConfig {
    field: string;
    type?: string;
    dedupe?: boolean;
    wrap?: boolean;
    maxLength?: number;
    options: OptionEntry[];
}

interface XrmAttribute {
    getAttributeType(): string;
    getValue(): unknown;
    addOnChange(handler: () => void): void;
    removeOnChange(handler: () => void): void;
}

interface XrmControl {
    getVisible?(): boolean;
}

interface XrmTab {
    addTabStateChange(handler: () => void): void;
    removeTabStateChange(handler: () => void): void;
}

interface XrmPage {
    getAttribute(name: string): XrmAttribute | null;
    getControl(name: string): XrmControl | null;
    ui: XrmPageUi;
}

interface XrmWithPage {
    Page: XrmPage;
}

function getXrm(): XrmWithPage | null {
    try {
        const win = window as Window & { Xrm?: XrmWithPage };
        const topWin = window.parent as Window & { Xrm?: XrmWithPage };
        const candidates: (XrmWithPage | undefined)[] = [win.Xrm, topWin.Xrm];
        for (const xrm of candidates) {
            if (xrm?.Page) {
                return xrm;
            }
        }
    } catch {
        // Xrm may be inaccessible across origins
    }
    return null;
}

function isLiveForm(xrm: XrmWithPage | null): boolean {
    try {
        if (!xrm || !xrm.Page || !xrm.Page.ui) {
            return false;
        }
        const ft = xrm.Page.ui.getFormType && xrm.Page.ui.getFormType();
        return typeof ft === "number" && ft > 0;
    } catch {
        return false;
    }
}

function tryMountHideStyle(context: ComponentFramework.Context<IInputs>): void {
    try {
        if (!isLiveForm(getXrm())) {
            return;
        }
        const logicalName = context.parameters.anchor.attributes?.LogicalName;
        if (logicalName) {
            installMountHideStyle(logicalName);
        }
    } catch {
        // mount column name unavailable
    }
}

function parseConfig(
    configJson: string | null | undefined,
    anchorRaw: string | null | undefined
): FieldConfig[] {
    let raw = (configJson ?? "").trim();
    if (!raw) {
        raw = (anchorRaw ?? "").trim();
    }
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw) as { fields?: FieldConfig[] };
        if (!parsed || !Array.isArray(parsed.fields)) {
            return [];
        }
        return parsed.fields;
    } catch (err) {
        console.error("ColumnInfoText: config parse failed", err);
        return [];
    }
}

function normText(s: string | number): string {
    return String(s).trim().toLowerCase();
}

function normNum(n: string | number): string {
    return String(Number(n));
}

// Date-time fields match on local calendar day only; exact instant not supported.
function normDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}

function resolveValues(attr: XrmAttribute): string[] {
    const t = attr.getAttributeType();
    const raw = attr.getValue();

    if (t === "optionset") {
        const value = raw as number | null;
        return value == null ? [] : [String(value)];
    }
    if (t === "multiselectoptionset") {
        const value = raw as number[] | null;
        return Array.isArray(value) ? value.map(String) : [];
    }
    if (t === "boolean") {
        const value = raw as boolean | null | undefined;
        if (value == null) {
            return [];
        }
        return [value ? "1" : "0"];
    }
    if (t === "string") {
        const value = raw as string | null;
        return value == null || value.trim() === "" ? [] : [normText(value)];
    }
    if (t === "decimal" || t === "double") {
        const value = raw as number | null;
        return value == null ? [] : [normNum(value)];
    }
    if (t === "money") {
        const value = raw as number | null;
        return value == null ? [] : [normNum(value)];
    }
    if (t === "datetime") {
        const value = raw as Date | null;
        return value == null ? [] : [normDate(value)];
    }
    return [];
}

function normConfigValue(t: string, v: string | number): string {
    if (t === "optionset" || t === "multiselectoptionset" || t === "boolean") {
        return String(Number(v));
    }
    if (t === "string") {
        return normText(v);
    }
    if (t === "decimal" || t === "double" || t === "money") {
        return normNum(v);
    }
    if (t === "datetime") {
        return String(v).trim();
    }
    return String(v);
}

function applyText(
    div: HTMLDivElement,
    info: string,
    wrap: boolean,
    maxLength: number
): void {
    const shown =
        maxLength > 0 && info.length > maxLength
            ? info.slice(0, maxLength).trimEnd() + "\u2026"
            : info;
    div.textContent = shown;
    if (shown !== info || wrap === false) {
        div.title = info;
    } else {
        div.removeAttribute("title");
    }
    if (wrap === false) {
        div.style.whiteSpace = "nowrap";
        div.style.overflow = "hidden";
        div.style.textOverflow = "ellipsis";
    } else {
        div.style.whiteSpace = "normal";
        div.style.overflowWrap = "break-word";
    }
}

function removeInfo(field: string): void {
    const el = document.getElementById(INFO_ID(field));
    if (el) {
        el.remove();
    }
}

function injectInfo(
    field: string,
    entries: OptionEntry[],
    fieldCfg: FieldConfig
): void {
    const host = document.querySelector(SECTION_ITEM(field)) as HTMLElement | null;
    if (!host) {
        return;
    }

    host.style.flexWrap = "wrap";
    removeInfo(field);

    const box = document.createElement("div");
    box.id = INFO_ID(field);
    box.setAttribute("data-cht", "1");
    box.style.flexBasis = "100%";
    box.style.width = "100%";
    box.style.marginTop = "4px";

    for (const entry of entries) {
        const effWrap = entry.wrap ?? fieldCfg.wrap ?? true;
        const effMaxLength = entry.maxLength ?? fieldCfg.maxLength ?? 0;
        const div = document.createElement("div");
        div.className = "cht-info";
        if (entry.background) {
            div.style.background = entry.background;
        }
        if (entry.textColor) {
            div.style.color = entry.textColor;
        }
        applyText(div, entry.info ?? "", effWrap, effMaxLength);
        box.appendChild(div);
    }

    host.appendChild(box);
}

function processField(xrm: XrmWithPage, fieldCfg: FieldConfig): void {
    const field = fieldCfg.field;
    const attr = xrm.Page.getAttribute(field);
    const ctrl = xrm.Page.getControl(field);
    if (!attr || !ctrl) {
        removeInfo(field);
        return;
    }
    if (ctrl.getVisible && ctrl.getVisible() === false) {
        removeInfo(field);
        return;
    }

    const t = attr.getAttributeType();
    const tokens = resolveValues(attr);
    if (tokens.length === 0) {
        removeInfo(field);
        return;
    }

    const optionMap = new Map<string, OptionEntry>();
    for (const opt of fieldCfg.options ?? []) {
        optionMap.set(normConfigValue(t, opt.value), opt);
    }

    const entries: OptionEntry[] = [];
    for (const token of tokens) {
        const entry = optionMap.get(token);
        if (entry) {
            entries.push(entry);
        }
    }
    if (entries.length === 0) {
        removeInfo(field);
        return;
    }

    let finalEntries = entries;
    if (fieldCfg.dedupe === true) {
        const seen = new Set<string>();
        finalEntries = [];
        for (const entry of entries) {
            const key =
                (entry.info ?? "") +
                "|" +
                (entry.background ?? "") +
                "|" +
                (entry.textColor ?? "");
            if (!seen.has(key)) {
                seen.add(key);
                finalEntries.push(entry);
            }
        }
    }
    if (finalEntries.length === 0) {
        removeInfo(field);
        return;
    }

    injectInfo(field, finalEntries, fieldCfg);
}

function isChtNode(node: Node | null): boolean {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }
    const el = node as Element;
    if (el.getAttribute("data-cht") === "1") {
        return true;
    }
    return el.closest('[data-cht="1"]') !== null;
}

function hasExternalMutation(mutations: MutationRecord[]): boolean {
    for (const mutation of mutations) {
        if (!isChtNode(mutation.target)) {
            return true;
        }
        for (const node of Array.from(mutation.addedNodes)) {
            if (!isChtNode(node)) {
                return true;
            }
        }
        for (const node of Array.from(mutation.removedNodes)) {
            if (!isChtNode(node)) {
                return true;
            }
        }
    }
    return false;
}

interface ChangeHandler {
    field: string;
    handler: () => void;
}

interface TabHandler {
    tab: XrmTab;
    handler: () => void;
}

export class ColumnInfoText implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private context!: ComponentFramework.Context<IInputs>;
    private observer: MutationObserver | null = null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private changeHandlers: ChangeHandler[] = [];
    private tabHandlers: TabHandler[] = [];
    private injectAllBound!: () => void;
    private configCacheKey = "";
    private configCache: FieldConfig[] = [];

    constructor() {
        // Empty
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        _notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary,
        _container: HTMLDivElement
    ): void {
        tryMountHideStyle(context);

        this.context = context;
        this.injectAllBound = () => {
            this.injectAll();
        };
        this.setupReactivity();
        this.injectAll();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.context = context;
        tryMountHideStyle(context);
        this.injectAll();
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        const xrm = getXrm();
        if (xrm) {
            for (const { field, handler } of this.changeHandlers) {
                try {
                    const attr = xrm.Page.getAttribute(field);
                    if (attr) {
                        attr.removeOnChange(handler);
                    }
                } catch {
                    // attribute may already be gone
                }
            }
            for (const { tab, handler } of this.tabHandlers) {
                try {
                    tab.removeTabStateChange(handler);
                } catch {
                    // tab may already be gone
                }
            }
        }
        this.changeHandlers = [];
        this.tabHandlers = [];
        this.configCacheKey = "";
        this.configCache = [];

        document.querySelectorAll('[data-cht="1"]').forEach((el) => {
            el.remove();
        });

        try {
            removeMountHideStyle();
        } catch {
            // style may already be gone
        }
    }

    private getFields(): FieldConfig[] {
        const key =
            (this.context.parameters.configJson.raw ?? "") +
            "\0" +
            (this.context.parameters.anchor.raw ?? "");
        if (key !== this.configCacheKey) {
            this.configCache = parseConfig(
                this.context.parameters.configJson.raw,
                this.context.parameters.anchor.raw
            );
            this.configCacheKey = key;
        }
        return this.configCache;
    }

    private injectAll(): void {
        try {
            const xrm = getXrm();
            if (!xrm) {
                return;
            }
            const fields = this.getFields();
            for (const fieldCfg of fields) {
                if (fieldCfg.field) {
                    processField(xrm, fieldCfg);
                }
            }
        } catch (err) {
            console.error("ColumnInfoText: injectAll failed", err);
        }
    }

    private setupReactivity(): void {
        const xrm = getXrm();
        const fields = this.getFields();

        if (xrm) {
            for (const fieldCfg of fields) {
                if (!fieldCfg.field) {
                    continue;
                }
                try {
                    const attr = xrm.Page.getAttribute(fieldCfg.field);
                    if (attr) {
                        attr.addOnChange(this.injectAllBound);
                        this.changeHandlers.push({
                            field: fieldCfg.field,
                            handler: this.injectAllBound,
                        });
                    }
                } catch {
                    // field may not exist on this form
                }
            }

            try {
                const tabs = xrm.Page.ui.tabs.get();
                for (const tab of tabs) {
                    try {
                        tab.addTabStateChange(this.injectAllBound);
                        this.tabHandlers.push({ tab, handler: this.injectAllBound });
                    } catch {
                        // tab API may be unavailable
                    }
                }
            } catch {
                // tabs may not be accessible yet
            }
        }

        this.observer = new MutationObserver((mutations) => {
            if (!hasExternalMutation(mutations)) {
                return;
            }
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.debounceTimer = null;
                this.injectAll();
            }, 150);
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    }
}
