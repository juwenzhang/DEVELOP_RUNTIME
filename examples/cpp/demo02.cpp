#include<iostream>
#include<fstream>

#define FILE_NAME "demo02.txt"

int main() {
    std::ofstream outFile(FILE_NAME, std::ios::out);
    if (!outFile.is_open()) {
        std::cerr << "Failed to open file: " << FILE_NAME << std::endl;
        return 1;
    }
    outFile << "Hello, World!" << std::endl;
    outFile << "年龄：" << 25 << std::endl; 
    outFile.close();
    return 0;
}
