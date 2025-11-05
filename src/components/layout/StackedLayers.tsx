export const STACKED_LAYER_1 = "stacked-layer-1";
export const STACKED_LAYER_2 = "stacked-layer-2";
export const STACKED_LAYER_3 = "stacked-layer-3";
export const STACKED_LAYER_4 = "stacked-layer-4";

const StackedLayers = () => {
  return (
    <>
      <div id={STACKED_LAYER_1} className="relative z-1"></div>
      <div id={STACKED_LAYER_2} className="relative z-2"></div>
      <div id={STACKED_LAYER_3} className="relative z-3"></div>
      <div id={STACKED_LAYER_4} className="z-4 relative"></div>
    </>
  );
};

export default StackedLayers;
