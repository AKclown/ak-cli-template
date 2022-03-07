const fse = require('fs-extra');
const inquirer = require('inquirer');
const glob = require('glob');
const ejs = require('ejs');

// 进行ejs模板渲染
async function ejsRender(options) {
    const dir = options.targetPath;
    // this.projectInfo在ejs无法直接获取到
    const projectInfo = options.data;
    return new Promise((resolve, reject) => {
        glob('**', {
            cwd: dir,
            // 忽略文件
            ignore: options.ignore || '',
            // 目录文件排除
            nodir: true
        }, (err, files) => {
            if (err) {
                reject(err)
            }
            Promise.all(files.map(file => {
                const filePath = path.join(dir, file);
                return new Promise((resolve1, reject1) => {
                    // ejs渲染
                    ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                        if (err) {
                            reject1(err);
                        } else {
                            fse.writeFileSync(filePath, result);
                            resolve1(result);
                        }
                    })
                }).then(() => {
                    resolve()
                }).catch(() => {
                    reject();
                })
            }))
        })
    })
}

async function install(options) {
    const projectPrompt = [];
    const descriptionPrompt = {
        type: 'input',
        name: 'description',
        message: '请输入项目的描述信息',
        default: '',
        validate: function (v) {
            const done = this.async();
            /**
             * 1. 首字母必须为英文字符
             * 2. 尾字符必须为英文或数字，不能为字符
             * 3. 字符仅允许“-_”
             */
            setTimeout(function () {
                if (!isValidName(v)) {
                    done('请输入合法的组件描述');
                    return;
                }
                // Pass the return value in the done callback
                done(null, true);
            }, 0);
        },
    }
    projectPrompt.push(descriptionPrompt);
    const projectInfo = await inquirer.prompt(projectPrompt);
    options.projectInfo.description = projectInfo.description;
    const { sourcePath, targetPath } = options;
    try {
        fse.ensureDirSync(sourcePath);
        fse.ensureDirSync(targetPath);
        fse.copySync(sourcePath, targetPath);
        // $ 动态获取mongodb配置得ignore
        const templateIgnore = options.templateIgnore.ignore || []
        const ignore = ['node_modules/**', ...templateIgnore];
        await ejsRender({ ignore, targetPath, data: options.projectInfo });
        // const { installCommand, startCommand } = options;
        // // // 依赖安装
        // await this.execCommand(installCommand, '依赖安装过程中失败！');
        // // // 启动命令执行
        // await this.execCommand(startCommand, '项目启动失败！');
    } catch (error) {
        throw error;
    }
}



module.exports = install;