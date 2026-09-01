<script>
    let username = $state('');
    let user = $state(null);

    async function getUsername() {
        let res = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        let data = await res.json();
        user = data.data;
        console.log(user);
    }
</script>

<input
    type="text"
    placeholder="Enter your username"
    bind:value={username}
    class="border p-2 rounded w-full"/>
    <p class="mt-2 text-gray-600">Current username: {username}</p>
    <button class="mt-4 bg-blue-500 text-white p-2 rounded" on:click={getUsername}>
    Submit
    </button>

    {#if user}
        <p class="mt-2 text-gray-600">Fetched username: {user.login}</p>
        <p class="mt-2 text-gray-600">Fetched email: {user.email ? user.email : 'Not provided'}</p>

    {/if}