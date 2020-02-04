  
#include <napi.h>
#include "Samples/functionexample.h"
#include "libsodium/hashing.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  mysodium::Init(env, exports);
  return functionexample::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)