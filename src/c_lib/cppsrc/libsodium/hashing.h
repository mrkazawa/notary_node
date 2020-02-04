#include <napi.h>

namespace mysodium {
    unsigned char* hash(unsigned char* message);
    Napi::String HashWrapped(const Napi::CallbackInfo& info);

    Napi::Object Init(Napi::Env env, Napi::Object exports);
}