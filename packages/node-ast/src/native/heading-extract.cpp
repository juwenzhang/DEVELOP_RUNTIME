#include <algorithm>
#include <napi.h>
#include <regex>
#include <vector>
#include <string>
#include <map>

std::vector<std::map<std::string, std::string>> extractHeadings(const std::string mdContent) {
    // define root node
    std::vector<std::map<std::string, std::string>> headings;
    std::regex headingRegex("^#{1,6}\\s+(.*)$", std::regex_constants::multiline);
    std::sregex_iterator iter(mdContent.begin(), mdContent.end(), headingRegex);
    std::sregex_iterator end;
    
    while (iter != end) {
        std::smatch match = *iter;
        std::string fullMatch = match[0];
        std::string headingText = match[1];
        // get level from number of #
        int level = std::count(fullMatch.begin(), fullMatch.end(), '#');
        // save level id and text into heading map
        std::map<std::string, std::string> heading;
        heading["level"] = std::to_string(level);
        heading["text"] = headingText;
        std::string id = headingText;
        std::transform(id.begin(), id.end(), id.begin(), ::tolower);
        std::replace(id.begin(), id.end(), ' ', '-');
        heading["id"] = id;

        // add heading to headings vector
        headings.push_back(heading);
        ++iter;
    }
    
    return headings;
}

// resize c++ vector to js array
Napi::Value ExtractHeadings(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // varify input argument
    if (info.Length() != 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Argument must be a string").ThrowAsJavaScriptException();
        return env.Null();
    }
    // js string to c++ string
    std::string mdContent = info[0].As<Napi::String>().Utf8Value();
    auto headings = extractHeadings(mdContent);

    Napi::Array result = Napi::Array::New(env, headings.size());
    for (size_t i = 0; i < headings.size(); ++i) {
        Napi::Object headingObj = Napi::Object::New(env);
        headingObj.Set("level", Napi::Number::New(env, std::stoi(headings[i]["level"])));
        headingObj.Set("text", Napi::String::New(env, headings[i]["text"]));
        headingObj.Set("id", Napi::String::New(env, headings[i]["id"]));
        result.Set(i, headingObj);
    }
    return result;
}

// register plugins
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(
        Napi::String::New(env, "extractHeadings"),
        Napi::Function::New(env, ExtractHeadings)
    );
    return exports;
}

NODE_API_MODULE(heading_extract, Init)
