#include <iostream>

// 预处理器实现操作吧
#define LENGTH 10
#define WIDTH 5

[[noreturn]] void error(const std::string& msg) {
    std::cerr << "Error: " << msg << std::endl;
    std::exit(1);
}

[[nodiscard]] int add(int a, int b) {
    return a + b;
}

int main() {
    int area;

    area = LENGTH * WIDTH;
    std::cout << "area is: " << area << std::endl;

    return 0;
}
