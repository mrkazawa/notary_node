#include "sodium.h"
#include "hashing.h"

unsigned char* mysodium::hash(unsigned char* message) {
    unsigned char out[crypto_hash_sha256_BYTES]; // hash output
    size_t messageLength; 

    messageLength = strlen((char*) message);
    crypto_hash(out, message, messageLength);

    return out;
}

Napi::String mysodium::HashWrapped(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String message expected").ThrowAsJavaScriptException();
    }

    Napi::String message = info[0].As<Napi::String>();

    int returnValue = mysodium::hash(message);
    
    return Napi::String::New(env, returnValue);
}

Napi::Object mysodium::Init(Napi::Env env, Napi::Object exports) {
    exports.Set("hash", Napi::Function::New(env, mysodium::HashWrapped));
    return exports;
}