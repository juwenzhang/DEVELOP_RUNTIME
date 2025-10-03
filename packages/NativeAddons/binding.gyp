{
  "targets": [
    {
      "target_name": "addon",  # 定义扩展的名 --> addon.node
      "sources": ["./src/hello.cc"],
      "include_dirs": [
        # 通过 node-addon-api 实现动态的获取得到 node.h 的路径吧
        "<!(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        # 依赖 node-addon-api 的配置
        "<!(node -p \"require('node-addon-api').gyp\")"
      ]
    }
  ]
}
