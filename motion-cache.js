/* Numeric density lookup only. Visible ASCII is drawn directly as text. */
(() => {
 const EXP_STEPS=128,EXP_MAX=2.5;
 const expLut=new Float32Array(EXP_STEPS+1);
 for(let i=0;i<=EXP_STEPS;i++) expLut[i]=Math.exp(-(i/EXP_STEPS)*EXP_MAX);

 window.portfolioMotion={EXP_SCALE:EXP_STEPS/EXP_MAX,expLut};
})();
