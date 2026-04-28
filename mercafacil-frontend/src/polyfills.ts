// SockJS expects a Node-like global object in some browser builds.
(globalThis as Record<string, unknown>)['global'] ??= globalThis;
