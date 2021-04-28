// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package css

import "testing"

func TestValidateCSS(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expectError bool
	}{
		{
			"ok",
			`
.some-element {
	padding: 12px;
}
			`,
			false,
		},
		{
			"non-class selector",
			`
body {
	color: hotpink;
}

.some-element {
	padding: 12px;
}
			`,
			true,
		},
		{
			"nested non-class selector",
			`
@media screen and (min-width: 4000px) {
	body, .other-thing {
		color: hotpink;
	}
}

.some-element {
	padding: 12px;
}
			`,
			true,
		},
		{
			"disallowed pseudo class",
			`
.some-element:first-child {
	padding: 12px;
}
			`,
			true,
		},
		{
			"uses opacity",
			`
body {
	color: hotpink;
}

.some-element {
	opacity: 0;
}
			`,
			true,
		},
		{
			"uses prefixed opacity",
			`
body {
	color: hotpink;
}

.some-element {
	-webkit-opacity: 0;
}
			`,
			true,
		},
		{
			"nested opacity",
			`
body {
	color: hotpink;
}

@media screen and (min-width: 400em) {
	.some-element {
		opacity: 0;
	}
}
			`,
			true,
		},
		{
			"content",
			`
body {
	color: hotpink;
}

.some-element::before {
	content: 'zomfg';
}
			`,
			true,
		},
		{
			"filter",
			`
body {
	color: hotpink;
}

.some-element {
	filter: opacity(0);
}
			`,
			true,
		},
		{
			"image url",
			`
body {
	color: hotpink;
}

.some-element {
	background-image: url('https://example.com/no-thanks.jpg)
}
			`,
			true,
		},
		{
			"javascript url",
			`
body {
	color: hotpink;
}

.some-element {
	background-image: "javascript:alert(1)";
}
			`,
			true,
		},
		{
			"IE expression",
			`
body {
	color: hotpink;
}

.some-element {
	text-size: "expression(alert('XSS'))";
}
			`,
			true,
		},
		{
			"hidden in invalid css",
			`
body {
	color: hotpink;
}

.break-it {
	color: red;

@media screen {
	.some-element {
		background-image: "javascript:alert(1)";
	}
}
`,
			true,
		},
		{
			"font size on host",
			`
.banner__root {
	color: hotpink;
	font-size: 24px;
}
`,
			false,
		},
		{
			"invalid font size on host",
			`
.banner__root {
	color: hotpink;
	font-size:  4px;
}
`,
			true,
		},
		{
			"font size on blocked element",
			`
.banner__root {
	color: hotpink;
	font-size:  14px;
}
.banner__buttons {
	font-size: 78px;
}
`,
			true,
		},
		{
			"width",
			`
.banner__root {
	width: 12px;
}
`,
			true,
		},
		{
			"font size on rule with multiple selectors",
			`
.banner__root, .banner__buttons {
	color: hotpink;
	font-size:  14px;
}
`,
			true,
		},
		{
			"width",
			`
.banner__root {
	width: 12px;
}
`,
			true,
		},
		{
			"negative value",
			`
.banner__root {
	margin: 0 0 0 -9999px;
}
`,
			true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := ValidateCSS(test.input)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
