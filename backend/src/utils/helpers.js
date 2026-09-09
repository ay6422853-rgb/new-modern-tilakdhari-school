export const nextNo=(prefix)=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
export function asyncHandler(fn){return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
