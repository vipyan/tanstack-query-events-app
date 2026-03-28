# TanStack Query — Learning Project

A React-based Events Management app built to learn and practice **TanStack Query v5** (formerly React Query). The app allows users to browse, search, create, edit, and delete events — all powered by TanStack Query for server state management.

---

## Tech Stack

| Layer        | Technology                       |
|--------------|----------------------------------|
| Frontend     | React 19, Vite, React Router v6  |
| Server State | TanStack Query v5                |
| Backend      | Node.js, Express (port 3000)     |
| Styling      | Plain CSS                        |

---

## Project Structure

```
01-starting-project/
├── src/
│   ├── App.jsx                       # QueryClientProvider + Router setup
│   ├── utils/http.js                 # API fetch functions
│   └── components/
│       ├── Events/
│       │   ├── NewEventsSection.jsx  # useQuery — fetch latest events
│       │   ├── FindEventSection.jsx  # useQuery — search with enabled flag
│       │   ├── NewEvent.jsx          # useMutation — create event
│       │   ├── EditEvent.jsx         # useQuery + useMutation — fetch & update
│       │   └── EventDetails.jsx      # useQuery + useMutation — fetch & delete
│       └── UI/
│           ├── Modal.jsx
│           ├── LoadingIndicator.jsx
│           └── ErrorBlock.jsx
└── backend/
    └── app.js                        # REST API — GET/POST/PUT/DELETE /events
```

---

## Getting Started

**1. Start the backend**
```bash
cd backend
npm install
node app.js
# Runs on http://localhost:3000
```

**2. Start the frontend**
```bash
# from project root
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## API Endpoints (Backend)

| Method | Endpoint        | Description                                     |
|--------|-----------------|-------------------------------------------------|
| GET    | `/events`       | List events (supports `?search=` and `?max=`)   |
| GET    | `/events/:id`   | Get single event                                |
| POST   | `/events`       | Create new event                                |
| PUT    | `/events/:id`   | Update event                                    |
| DELETE | `/events/:id`   | Delete event                                    |
| GET    | `/events/images`| List available images                           |

---

## TanStack Query — Key Concepts

### 1. QueryClient & QueryClientProvider

`QueryClient` is the core cache manager. Wrap your entire app with `QueryClientProvider` so every component can access it.

```jsx
// src/App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

### 2. `useQuery` — Fetching Data

`useQuery` is the primary hook for reading/fetching server data. TanStack Query handles caching, background refetching, loading, and error states automatically.

```jsx
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../../utils/http.js';

const { data, isPending, isError, error } = useQuery({
  queryKey: ['events'],         // cache key — must be unique per query
  queryFn: fetchEvents,         // async function that returns data
  staleTime: 5 * 60 * 1000,    // how long cached data is considered fresh (ms)
});
```

**Return values:**

| Value        | Description                                          |
|--------------|------------------------------------------------------|
| `data`       | The resolved data from `queryFn`                     |
| `isPending`  | `true` while the first fetch is in progress          |
| `isFetching` | `true` on any fetch, including background refetches  |
| `isError`    | `true` if `queryFn` threw an error                   |
| `error`      | The thrown error object                              |
| `isSuccess`  | `true` when data is available                        |

---

### 3. Query Keys

The `queryKey` array is TanStack Query's cache identifier. Queries with different keys are stored separately. Keys can include variables to create distinct cache entries per set of parameters.

```jsx
// Simple key
queryKey: ['events']

// Parameterized key — separate cache entry per search term
queryKey: ['events', { search: searchTerm }]

// Key with route param — separate entry per event id
queryKey: ['events', id]
```

- If `queryKey` changes, TanStack Query re-runs `queryFn` automatically.
- Use `queryClient.invalidateQueries({ queryKey: ['events'] })` to mark cached data as stale and trigger a background refetch.

---

### 4. `enabled` — Conditional / Dependent Queries

Use `enabled` to prevent a query from running until a condition is met. This is useful for search inputs (don't fetch until the user types) or dependent queries (fetch B only after A resolves).

```jsx
// src/components/Events/FindEventSection.jsx
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['events', { search: searchTerm }],
  queryFn: ({ signal }) => fetchEvents({ signal, searchTerm }),
  enabled: searchTerm !== undefined,  // only run when searchTerm is set
});
```

---

### 5. AbortSignal & Request Cancellation

TanStack Query passes an `AbortSignal` into `queryFn` via the function argument. Forward it to `fetch()` so requests are automatically cancelled when the component unmounts or the query key changes (e.g., rapid typing in a search box).

```js
// src/utils/http.js
export async function fetchEvents({ signal, searchTerm }) {
  let url = 'http://localhost:3000/events';
  if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;

  const response = await fetch(url, { signal }); // signal cancels stale requests
  // ...
}
```

```jsx
// Pass signal from queryFn context
queryFn: ({ signal }) => fetchEvents({ signal, searchTerm }),
```

---

### 6. `useMutation` — Creating / Updating / Deleting Data

`useMutation` is for operations that change server data (POST, PUT, DELETE). Unlike `useQuery`, it does not run automatically — you call `mutate()` manually.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNewEvent } from '../../utils/http.js';

const queryClient = useQueryClient();

const { mutate, isPending, isError, error } = useMutation({
  mutationFn: createNewEvent,
  onSuccess: () => {
    // Invalidate the events list so it refetches with the new event
    queryClient.invalidateQueries({ queryKey: ['events'] });
    navigate('/events');
  },
});

function handleSubmit(formData) {
  mutate({ event: formData });
}
```

**Key `useMutation` options:**

| Option       | Description                                          |
|--------------|------------------------------------------------------|
| `mutationFn` | Async function that performs the mutation            |
| `onSuccess`  | Callback fired when `mutationFn` resolves            |
| `onError`    | Callback fired when `mutationFn` throws              |
| `onSettled`  | Fires after success or error (like `finally`)        |

---

### 7. `staleTime` vs `gcTime`

| Option      | Default | Description                                                         |
|-------------|---------|---------------------------------------------------------------------|
| `staleTime` | `0`     | How long data is considered fresh. No refetch during this window.   |
| `gcTime`    | 5 min   | How long unused/inactive cached data is kept before garbage collected. |

```jsx
useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  staleTime: 5 * 60 * 1000,   // treat data as fresh for 5 minutes
  gcTime: 10 * 60 * 1000,     // keep cache for 10 minutes after last use
});
```

---

### 8. `queryClient.invalidateQueries`

After a mutation, the cached data is outdated. Call `invalidateQueries` to mark queries as stale and trigger a background refetch the next time they are observed.

```jsx
// Invalidate all queries whose key starts with ['events']
queryClient.invalidateQueries({ queryKey: ['events'] });
```

---

### 9. Prefetching with `queryClient.fetchQuery`

You can fetch data ahead of time — before a component renders — using `fetchQuery`. This is useful in React Router loader functions or for hover-based prefetching.

```jsx
// In a React Router loader function
export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
}
```

The data lands in the cache so `useQuery` with the same key finds it instantly (no loading state on navigation).

---

### 10. Optimistic Updates

Instead of waiting for the server response, you can immediately update the UI and roll back on error.

```jsx
useMutation({
  mutationFn: updateEvent,
  onMutate: async (newEventData) => {
    // Cancel in-flight queries so they don't overwrite the optimistic update
    await queryClient.cancelQueries({ queryKey: ['events', id] });

    // Snapshot current cache for potential rollback
    const previousEvent = queryClient.getQueryData(['events', id]);

    // Optimistically apply the new data
    queryClient.setQueryData(['events', id], newEventData);

    return { previousEvent };
  },
  onError: (error, newData, context) => {
    // Roll back to previous value on failure
    queryClient.setQueryData(['events', id], context.previousEvent);
  },
  onSettled: () => {
    // Always sync with server after mutation
    queryClient.invalidateQueries({ queryKey: ['events', id] });
  },
});
```

---

## Concept Summary

```
QueryClient          — central cache store, created once, passed via Provider
QueryClientProvider  — makes QueryClient available to all child components
useQuery             — read/fetch data; handles caching, loading, error states
useMutation          — write/change data; triggered manually via mutate()
queryKey             — cache identifier; changes trigger automatic re-fetch
queryFn              — async function that fetches data; receives signal, meta
staleTime            — duration data is fresh; prevents unnecessary refetches
enabled              — boolean to conditionally run a query
invalidateQueries    — marks cache as stale, triggers background refetch
setQueryData         — directly write to cache (used for optimistic updates)
fetchQuery           — imperatively prefetch into cache (e.g. in route loaders)
```

---

## Learning Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Query v5 Migration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- [Practical React Query — TkDodo's Blog](https://tkdodo.eu/blog/practical-react-query)
