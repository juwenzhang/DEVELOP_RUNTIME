#include <iostream>
#include <string>
#include <optional>
#include <cstdlib>
#include <stdexcept>


[[nodiscard("配置的是解析错误，以及其必须进行处理")]] enum class ParserError: int {
    None,
    InvalidFormat,
    MissingKey,
    TypeMismatch
};

[[deprecated("已经过期的API，请不要进行使用了吧，使用V2即可吧")]] class ConfigParserV1 {
public:
    [[nodiscard]] ParserError parse(const std::string& config) {
        if (config.empty()) {
            return ParserError::InvalidFormat;
        }
        return ParserError::None;
    }
};

class ConfigParserV2 {
private:
    struct SectionMarker {};
    [[no_unique_address]] SectionMarker section_marker;
public:
    [[nodiscard]] std::optional<std::string> get_value(const std::string& config, const std::string& key) {
        if ([[likely]] config.find(key) != std::string::npos) {
            return "value_for_" + key;
        }
        else {
            return std::nullopt;
        }
    }

    bool validate_format([[maybe_unused]] const std::string& config,
                         [[maybe_unused]] const std::string& key) {
        return config.find(key) != std::string::npos;
    }
};

class ErrorHandler {
public:
    [[noreturn]] static void fatal_error(const std::string& msg, int exit_code) {
        std::cerr << "Fatal Error: " << msg << std::endl;
        std::exit(exit_code);
    }

    [[nodiscard]] bool log_warning(const std::string& msg) {
        std::cout << "Warning: " << msg << std::endl;
        return true;
    }
};

int main() {
    ConfigParserV1 old_parser;
    if (old_parser.parse("config") == ParserError::None) {
        ErrorHandler::fatal_error("Old parser failed", 1);
    }

    ConfigParserV2 new_parser;
    if (!new_parser.validate_format("config", "key")) {
        ErrorHandler::fatal_error("New parser format is invalid", 1);
    }

    auto port = new_parser.get_value("config", "port");
    if ([[unlikely]] !port.has_value()) { // 小概率分支
        ErrorHandler::fatal_error("Port not found in config", 1);
    }

    std::cout << "Port: " << port.value() << std::endl;

    return 0;
}
