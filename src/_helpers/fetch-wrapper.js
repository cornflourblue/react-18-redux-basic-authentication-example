import { store, authActions } from '_store';

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method) {
    return (url, body) => {
        const requestOptions = {
            method,
            headers: authHeader(url)
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        return fetch(url, requestOptions).then(handleResponse);
    }
}

// helper functions

function authHeader(url) {
    // return auth header with basic auth credentials if user is logged in and request is to the api url
    const authData = basicAuthData();
    const isLoggedIn = !!authData;
    const isApiUrl = url.startsWith(process.env.REACT_APP_API_URL);
    if (isLoggedIn && isApiUrl) {
        return { Authorization: `Basic ${authData}` };
    } else {
        return {};
    }
}

function basicAuthData() {
    return store.getState().auth.user?.authdata;
}

async function handleResponse(response) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    // check for error response
    if (!response.ok) {
        if (basicAuthData() && [401, 403].includes(response.status)) {
            // auto logout if logged in and response status is 401 Unauthorized or 403 Forbidden
            const logout = () => store.dispatch(authActions.logout());
            logout();
        }

        // get error message from body or default to response status
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
    }

    return data;
}