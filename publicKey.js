export default async function loadPublicKey() {

    try {

        // make get api call to auth server
        const response = await fetch(
            `${process.env.AUTH_URL}/auth/public/key`
        );

        // save the public key as global veriable
        const data = await response.json();
        global.PUBLIC_KEY = data.publicKey;

        console.log(`Public Key Retrived Sucessfully`);


    } catch (err) {

        console.log(`Public Key Retrival Error: ${err.message}`);
        
    }


}