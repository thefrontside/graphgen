package := npm/package.json

npm: $(package)

$(package): *.ts src/*.ts
	deno run -A npm-build.ts
clean:
	rm -rf npm
