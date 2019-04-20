window.fetch('http://localhost:8080/public-key?account_id=9b63c4d8-65c0-438c-9d30-cc4b01173393')
  .then(r => r.json())
  .then((response) => {
    return window.crypto.subtle.importKey(
      'jwk',
      response.public_key,
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' }
      },
      false,
      ['encrypt']
    )
  })
  .then((key) => {
    console.log(key)
  })
