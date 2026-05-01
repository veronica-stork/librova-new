import { clerkMiddleware } from '@clerk/nextjs/server';

// // 1. Define the routes you want to hide behind the login screen.
// const isStaffSubRoute = createRouteMatcher(['/staff/(.*)']);

// export default clerkMiddleware( (auth, req) => {
//   // 2. If the user tries to go to a staff route, force them to log in!
//   // If they go anywhere else (like /search), this gets skipped and they stay public.
//   if (isStaffSubRoute(req)) {
//     auth.protect();
//   }
// });

export default clerkMiddleware()


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};