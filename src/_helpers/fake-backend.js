export { fakeBackend };

function fakeBackend() {
    let users = [{ id: 1, username: 'test', password: 'test', firstName: 'Test', lastName: 'User' }];
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        return new Promise((resolve, reject) => {
            // wrap in timeout to simulate server api call
            setTimeout(handleRoute, 500);

            function handleRoute() {
                switch (true) {
                    case url.endsWith('/users/authenticate') && opts.method === 'POST':
                        return authenticate();
                    case url.endsWith('/users') && opts.method === 'GET':
                        return getUsers();
                    default:
                        // pass through any requests not handled above
                        return realFetch(url, opts)
                            .then(response => resolve(response))
                            .catch(error => reject(error));
                }
            }

            // route functions

            function authenticate() {
                const { username, password } = body();
                const user = users.find(x => x.username === username && x.password === password);

                if (!user) return error('Username or password is incorrect');

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    authdata: btoa(`${user.username}:${user.password}`)
                });
            }

            function getUsers() {
                if (!isAuthenticated()) return unauthorized();
                return ok(users);
            }

            // helper functions

            function ok(body) {
                resolve({ ok: true, json: () => Promise.resolve(body), ...headers() })
            }

            function unauthorized() {
                resolve({ status: 401, json: () => Promise.resolve({ message: 'Unauthorized' }), ...headers() })
            }

            function error(message) {
                resolve({ status: 400, json: () => Promise.resolve({ message }), ...headers() })
            }

            function isAuthenticated() {
                return opts.headers['Authorization'] === `Basic ${btoa('test:test')}`;
            }

            function body() {
                return opts.body && JSON.parse(opts.body);    
            }

            function headers() {
                return { headers: { get: () => 'application/json' } };
            }            
        });
    }
}
