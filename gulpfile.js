"use strict";

const gulp = require("gulp");
const argv = require("minimist")(process.argv.slice(2));
const gulpTs = require("gulp-typescript");
const gulpTslint = require("gulp-tslint");
const sourcemaps = require("gulp-sourcemaps");
const tslint = require("tslint");
const path = require("path");
const merge = require("merge2");
const webpack = require("webpack");
const gulpWebpack = require("webpack-stream");
const nodeExternals = require("webpack-node-externals");

const appProject = gulpTs.createProject("tsconfig.json");
const typeCheck = tslint.Linter.createProgram("tsconfig.json");

gulp.task("lint", () =>
    merge([
        gulp
            .src("./src/**/*.ts")
            .pipe(
                gulpTslint({
                    formatter: "prose",
                    program: typeCheck,
                })
            )
            .pipe(gulpTslint.report()),
        gulp
            .src("./app/**/*.ts")
            .pipe(
                gulpTslint({
                    formatter: "prose",
                    program: typeCheck,
                })
            )
            .pipe(gulpTslint.report()),
    ])
);

gulp.task("build", async () => {
    const del = await import("del");
    del.deleteSync(["./build/**/*.*"]);
    gulp.src("./src/**/*.js").pipe(gulp.dest("build/"));
    gulp.src("./src/**/*.json").pipe(gulp.dest("build/"));
    gulp.src("./src/**/*.png").pipe(gulp.dest("build/"));
    gulp.src("./src/**/*.ttf").pipe(gulp.dest("build/"));
    gulp.src(["./app/**/*.*", "!./app/**/*.ts"]).pipe(gulp.dest("build/app/"));

    const appCompile = gulp
        .src("./src/**/*.ts")
        .pipe(sourcemaps.init())
        .pipe(appProject());

    const externals = [];
    if (!argv.web) {
        externals.push(function () {
            var arg1 = arguments[0];
            var arg2 = arguments[1];
            var arg3 = arguments[2];

            if (/^moroboxai.*$/.test(arg2)) {
                return arg3();
            }

            if (/^moroxel.*$/.test(arg2)) {
                return arg3();
            }

            nodeExternals()(arg1, arg2, arg3);
        });
    }

    const renderCompile = gulp.src("./app/index.ts").pipe(
        gulpWebpack(
            {
                entry: ["./app/index.ts"],
                module: {
                    rules: [
                        {
                            loader: "ts-loader",
                            exclude: [/node_modules/, /src/],
                        },
                    ],
                },
                mode: "development",
                resolve: {
                    modules: ["node_modules", "app"],
                    extensions: [".tsx", ".ts", ".js"],
                },
                output: {
                    filename: "boot.js",
                },
                externals: [
                    ...externals,
                    {
                        MoroboxAIPlayer: "moroboxai-player-web",
                    },
                ],
                target: argv.web ? "web" : "electron-renderer",
                devtool: "inline-source-map",
            },
            webpack
        )
    );

    return merge([
        appCompile.js
            .pipe(
                sourcemaps.write({
                    sourceRoot: (file) => {
                        return path.relative(
                            path.join(file.cwd, file.path),
                            file.base
                        );
                    },
                })
            )
            .pipe(gulp.dest("build/")),
        renderCompile.pipe(gulp.dest("build/app/")),
    ]);
});
