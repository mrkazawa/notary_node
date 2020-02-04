#include <napi.h>
#include "actualclass.h"

class ClassExample : public Napi::ObjectWrap<ClassExample> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports); //Init function for setting the export key to JS
  ClassExample(const Napi::CallbackInfo& info); //Constructor to initialise

 private:
  static Napi::FunctionReference constructor; //reference to store the class definition that needs to be exported to JS
  Napi::Value GetValue(const Napi::CallbackInfo& info); //wrapped getValue function 
  Napi::Value Add(const Napi::CallbackInfo& info); //wrapped add function
  ActualClass *actualClass_; //internal instance of actualclass used to perform actual operations.
};