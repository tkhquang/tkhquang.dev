export type InspectionState = {
  focused: string | null;
  pinned: string | null;
  hovered: string | null;
};

export type InspectionEvent =
  | { type: "focus" | "hover" | "select"; key: string }
  | { type: "blur" | "leave" | "clear" };

export const initialInspection: InspectionState = {
  focused: null,
  pinned: null,
  hovered: null,
};

export function inspectionReducer(
  state: InspectionState,
  event: InspectionEvent
): InspectionState {
  switch (event.type) {
    case "focus":
      return { ...state, focused: event.key };
    case "blur":
      return { ...state, focused: null };
    case "hover":
      return { ...state, hovered: event.key };
    case "leave":
      return { ...state, hovered: null };
    case "select":
      return {
        ...state,
        pinned: state.pinned === event.key ? null : event.key,
      };
    case "clear":
      // Escape dismisses the pin without hiding the field that still has focus.
      return { ...state, pinned: null, hovered: null };
  }
}

export function activeFieldKey(
  state: InspectionState,
  defaultKey: string
): string {
  return state.focused ?? state.pinned ?? state.hovered ?? defaultKey;
}
