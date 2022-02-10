index := npm/dist/index.js

t:
	deno test

npm: $(index)

$(index): mod.ts src/*.ts
	mkdir -p npm/dist
	deno bundle mod.ts $@
clean:
	rm -rf npm/dist
