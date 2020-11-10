// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"text/scanner"
)

const (
	translationFunc = "__"
	opening         = '{'
	closing         = '}'
)

type token struct {
	token    string
	line     int
	filename string
}

func main() {
	for _, file := range os.Args[1:] {
		tokens, err := extractFromFile(file)
		if err != nil {
			panic(err)
		}
		for _, token := range tokens {
			fmt.Printf("#~ line %d \"%s\"\n", token.line, token.filename)
			fmt.Printf("gettext(%s)\n", token.token)
			fmt.Printf("\n")
		}
	}
}

func extractFromFile(f string) ([]*token, error) {
	var s scanner.Scanner
	tpl, err := ioutil.ReadFile(f)
	if err != nil {
		return nil, fmt.Errorf("extract: error opening file %s: %w", f, err)
	}
	s.Init(bytes.NewBuffer(tpl))
	s.Filename = f

	var braces [][]token
	for tok := s.Scan(); tok != scanner.EOF; tok = s.Scan() {
		if tok == opening && s.Peek() == opening {
			s.Scan()
			// gobble up every token until the matching closing braces
			braces = append(braces, []token{})
			for enclosedToken := s.Scan(); enclosedToken != scanner.EOF; enclosedToken = s.Scan() {
				if enclosedToken == closing && s.Peek() == closing {
					break
				}
				braces[len(braces)-1] = append(braces[len(braces)-1], token{
					token:    s.TokenText(),
					filename: s.Position.Filename,
					line:     s.Position.Line,
				})
			}
		}
	}

	var translationStrings []*token
	for _, brace := range braces {
		for idx, token := range brace {
			if token.token == translationFunc && len(brace) > idx+1 {
				translationStrings = append(translationStrings, &brace[idx+1])
			}
		}
	}
	return translationStrings, nil
}
