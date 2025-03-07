import { genIndex, genTsconfig, genPacakgeJson } from './template'
import fs from 'fs';
import path from 'path'

type TemplateParams = {
  serverName: string,
  serverDescrition: string,
  rootDir: string
}

/**
 * 检查并获取文件夹路径。
 * 如果文件夹不存在就创建它；如果存在，则检查其是否为空且拥有可写权限。
 * @param {string} dirPath - 要检查的文件夹路径
 * @returns {string} - 返回最终确认的文件夹路径
 * @throws 如果文件夹不可写，或存在但并非空文件夹，会抛出错误
 */
function ensureEmptyWritableDir(dirPath: string): string {
  const isExist = fs.existsSync(dirPath);

  if (!isExist) {
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  } else {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`${dirPath} is not a directory!`);
    }

    const files = fs.readdirSync(dirPath);
    if (files.length !== 0) {
      throw new Error(`${dirPath} is not empty!`);
    }

    try {
      fs.accessSync(dirPath, fs.constants.W_OK);
    } catch (err) {
      throw new Error(`${dirPath} is not writeable!`);
    }

    return dirPath;
  }
}

/**
 * 工具函数：在指定根目录 + 相对目录下写入文件；若该相对目录不存在则递归创建
 * @param {string} rootDir - 根目录
 * @param {string} resource.relativeDir - 相对于根目录的子目录 (可为空字符串)
 * @param {string} resource.name - 文件名
 * @param {string} resource.content - 文件内容
 */
function writeFile(rootDir: string, resource: { relativeDir: string, name: string, content: string }) {
  const targetDir = path.join(rootDir, resource.relativeDir || '');
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, resource.name);
  fs.writeFileSync(targetPath, resource.content, 'utf8');
}

export function genMcpServerProject(params: TemplateParams) {
  try {
    ensureEmptyWritableDir(params.rootDir)
    let package_json = genPacakgeJson({ serverName: params.serverName, serverDescript: params.serverDescrition })
    writeFile(params.rootDir, package_json)
    let index_js = genIndex({ serverName: params.serverName })
    writeFile(params.rootDir, index_js)
    let tsconfig = genTsconfig({})
    writeFile(params.rootDir, tsconfig)
  } catch (e) {
    console.error(e)
    return
  }
}
