((toolName)=>{
    if(typeof window[toolName] === 'undefined'){

        const loaderUtilities = { //This is exactly the same between shim.html and shim.js.
            
            domReady: new Promise((resolve, reject)=>{
                if(document.readyState === "loading"){
                    document.addEventListener('DOMContentLoaded', resolve);
                }
                else{
                    resolve();
                }   // add error handler?
            }),
            
            origin: (uri)=>{
                const parser = window.document.createElement('a');
                parser.href = uri;
                return `${parser.protocol}//${parser.host}`;
            },
            
            loadTool: (uri)=>{
                return new Promise((resolve, reject)=>{
                    const tag = window.document.createElement('iframe');
                    tag.src = uri;
                    tag.width = 0;
                    tag.height = 0;
                    tag.style = "visibility: hidden";
                    window.addEventListener("message",
                        (e)=>{
                            if(e.origin == loaderUtilities.origin(uri)){ //is it possible to refine the origin check?
                                resolve(e.data);
                            }
                        }, 
                        false);
                    loaderUtilities.domReady.then(()=>{
                        document.body.appendChild(tag);
                    });
                });   // add error handler?
            },
            
            requestOverPort: (port, resource)=>{
                return new Promise((resolve, reject)=>{
                    const disposableChannel = new MessageChannel();
                    disposableChannel.port1.onmessage = (e)=>{
                        resolve(e.data);
                        disposableChannel.port1.close();
                    };
                    port.postMessage(
                        {
                            resource: resource,
                            port: disposableChannel.port2
                        },
                        [disposableChannel.port2]);
                });
            },
        };
            
        const defaultClient = document.currentScript.getAttribute("data-default") || '';
        const gotClientPort = loaderUtilities.loadTool(`https://dhmnmivhwb1gk.cloudfront.net/dev/shim.html#${defaultClient}`);

        window[toolName] = {
            fetch: (request)=>{
                return gotClientPort
                    .then((clientPort)=>{
                        return loaderUtilities.requestOverPort(
                            clientPort,
                            {
                                url: request.url,
                                method: request.method
                            });
                    })
                    .then((receipt)=>{
                        return window.fetch(
                            request,
                            {
                                headers: new Headers({ 'Receipts-Receipt': receipt }),
                            });
                    });
            }
        }

    }
})(document.currentScript.getAttribute("data-name") || "FOTR")

