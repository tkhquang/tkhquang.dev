"use client";

import "./HexDiff.css";
import {
  activeFieldKey,
  initialInspection,
  inspectionReducer,
} from "./inspection";
import type { EncodingRole, PreparedHexDiffExample } from "./types";
import {
  useId,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const roleLabels: Record<EncodingRole, string> = {
  prefix: "Prefix",
  opcode: "Opcode",
  modrm: "ModR/M",
  sib: "SIB",
  displacement: "Displacement",
  immediate: "Immediate",
  unknown: "Unannotated",
};

const versions = ["before", "after"] as const;
const versionLabels = { before: "Before", after: "After" };
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Firefox restores a button's dynamic disabled state on reload, before
// hydration. Opt out so both renders use component state. The props object
// carries Firefox's button attribute, which React's button type omits.
const buttonProps = { autoComplete: "off" };

export default function HexDiffView({
  example,
}: {
  example: PreparedHexDiffExample;
}) {
  const id = useId();
  const interactive = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );
  const [inspection, dispatch] = useReducer(
    inspectionReducer,
    initialInspection
  );
  const [copyStatus, setCopyStatus] = useState("");
  const pointerFocus = useRef(false);
  const activeKey = activeFieldKey(inspection, example.defaultFieldKey);
  const activePair = example.pairs.find((pair) =>
    pair.before.fields.some((field) => field.key === activeKey)
  )!;
  const activeBefore = activePair.before.fields.find(
    (field) => field.key === activeKey
  )!;
  const activeAfter = activePair.after.fields.find(
    (field) => field.key === activeKey
  )!;
  const sameExplanation = activeBefore.description === activeAfter.description;

  async function copyBytes(version: (typeof versions)[number]) {
    try {
      await navigator.clipboard.writeText(example.copy[version]);
      setCopyStatus(`${versionLabels[version]} bytes copied.`);
    } catch {
      setCopyStatus(
        "Copy unavailable. Select the full byte string in Encoding breakdown."
      );
    }
  }

  return (
    <figure
      className="hex-diff"
      data-example={example.id}
      data-interactive={interactive}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-caption`}
      onKeyDownCapture={(event) => {
        pointerFocus.current = false;
        // Keyboard use can begin on a button that was focused by a pointer.
        // Promote that existing focus before passive hover gets another turn.
        if (
          event.target instanceof HTMLButtonElement &&
          event.target.dataset.field
        ) {
          dispatch({ type: "focus", key: event.target.dataset.field });
        }
        if (event.key === "Escape" && inspection.pinned) {
          event.stopPropagation();
          dispatch({ type: "clear" });
        }
      }}
    >
      <div className="hex-diff-header">
        <div>
          <p className="hex-diff-kicker">
            {example.architecture} · Byte comparison
          </p>
          <p className="hex-diff-title" id={`${id}-title`}>
            {example.title}
          </p>
        </div>
        <div className="hex-diff-tools">
          {versions.map((version) => (
            <button
              key={version}
              {...buttonProps}
              type="button"
              disabled={!interactive}
              onClick={() => copyBytes(version)}
              aria-label={`Copy ${version} bytes`}
            >
              Copy {version}
            </button>
          ))}
        </div>
      </div>

      <div className="hex-diff-comparison">
        {example.pairs.map((pair) => (
          <div className="hex-diff-pair" key={pair.id}>
            <p className="hex-diff-pair-title">{pair.label}</p>
            {versions.map((version) => (
              <div
                className="hex-diff-encoding"
                key={version}
                data-version={version}
              >
                <p className="hex-diff-version">{versionLabels[version]}</p>
                <div className="hex-diff-bytes">
                  {pair[version].fields.map((field) => (
                    <button
                      key={field.key}
                      {...buttonProps}
                      className="hex-diff-field"
                      type="button"
                      data-field={field.key}
                      data-role={field.role}
                      data-active={activeKey === field.key}
                      disabled={!interactive}
                      aria-label={`${versionLabels[version]}: ${pair.label}, ${roleLabels[field.role]}, ${field.hex}${field.bytes.some((byte) => byte.changed) ? ", changed" : ""}`}
                      aria-pressed={inspection.pinned === field.key}
                      aria-controls={`${id}-detail`}
                      aria-describedby={`${id}-${version}-${field.key}-description`}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse")
                          dispatch({ type: "hover", key: field.key });
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse")
                          pointerFocus.current = false;
                        dispatch({ type: "leave" });
                      }}
                      onPointerDown={() => {
                        pointerFocus.current = true;
                        dispatch({ type: "blur" });
                      }}
                      onPointerCancel={() => {
                        pointerFocus.current = false;
                      }}
                      onFocus={() => {
                        // Only the focus caused by this pointer press is
                        // passive; later focus changes must inspect the field.
                        const fromPointer = pointerFocus.current;
                        pointerFocus.current = false;
                        if (!fromPointer)
                          dispatch({ type: "focus", key: field.key });
                      }}
                      onBlur={() => dispatch({ type: "blur" })}
                      onClick={() => {
                        pointerFocus.current = false;
                        dispatch({ type: "select", key: field.key });
                      }}
                    >
                      {field.bytes.map((byte, index) => (
                        <span key={byte.offset}>
                          {index > 0 ? " " : ""}
                          <span
                            className="hex-diff-byte"
                            data-changed={byte.changed}
                          >
                            {byte.hex}
                          </span>
                        </span>
                      ))}
                      <span
                        hidden
                        id={`${id}-${version}-${field.key}-description`}
                      >
                        {field.description}
                      </span>
                    </button>
                  ))}
                </div>
                {pair.kind === "instruction" ? (
                  <code className="hex-diff-assembly">
                    {pair[version].assembly.map((part, index) => (
                      <span
                        key={index}
                        data-active={part.fieldKeys.includes(activeKey)}
                      >
                        {part.text}
                      </span>
                    ))}
                  </code>
                ) : (
                  <p className="hex-diff-context">
                    {pair[version].contextLabel}
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <ul className="hex-diff-legend" aria-label="Byte roles">
        {example.roles.map((role) => (
          <li key={role} data-role={role}>
            <span className="hex-diff-swatch" aria-hidden="true" />
            {roleLabels[role]}
          </li>
        ))}
        <li>
          <span className="hex-diff-change-key" aria-hidden="true">
            Aa
          </span>
          Changed byte
        </li>
      </ul>

      <div className="hex-diff-inspection">
        <div className="hex-diff-inspection-tools">
          <p>Inspect a field. Click or tap to keep it selected.</p>
          <button
            {...buttonProps}
            type="button"
            disabled={!inspection.pinned}
            onClick={() => dispatch({ type: "clear" })}
          >
            Clear selection
          </button>
        </div>
        <div className="hex-diff-detail" id={`${id}-detail`}>
          <p className="hex-diff-detail-title">
            {activePair.label} · {roleLabels[activeBefore.role]}
            {inspection.pinned === activeKey ? " · Selected" : ""}
          </p>
          {sameExplanation ? (
            <p>{activeBefore.description}</p>
          ) : (
            <>
              <p>
                <strong>Before: </strong>
                {activeBefore.description}
              </p>
              <p>
                <strong>After: </strong>
                {activeAfter.description}
              </p>
            </>
          )}
        </div>
      </div>

      <p className="hex-diff-copy-status" role="status">
        {copyStatus}
      </p>
      <details className="hex-diff-breakdown">
        <summary>Encoding breakdown</summary>
        <div className="hex-diff-breakdown-content">
          {versions.map((version) => (
            <div className="hex-diff-copy-text" key={version}>
              <p>{versionLabels[version]} bytes</p>
              <code>{example.copy[version]}</code>
            </div>
          ))}
          {example.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          {example.pairs.map((pair) => (
            <div className="hex-diff-breakdown-pair" key={pair.id}>
              <p>
                <strong>{pair.label}</strong>
              </p>
              {versions.map((version) => (
                <div key={version}>
                  <p className="hex-diff-breakdown-version">
                    {versionLabels[version]}:{" "}
                    {pair.kind === "instruction"
                      ? pair[version].assembly.map((part) => part.text).join("")
                      : pair[version].contextLabel}
                  </p>
                  <dl>
                    {pair[version].fields.map((field) => (
                      <div key={field.key}>
                        <dt>
                          {field.hex} · {roleLabels[field.role]}
                          {field.bytes.some((byte) => byte.changed)
                            ? " (changed)"
                            : ""}
                        </dt>
                        <dd>{field.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ))}
        </div>
      </details>
      <figcaption className="hex-diff-caption" id={`${id}-caption`}>
        {example.caption}
      </figcaption>
    </figure>
  );
}
