

export async function fetchData(name, url, init) {
  console.log(name);
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error(`${name} fetchData err: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}