// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import "testing"

func TestHashString(t *testing.T) {
	hash, hashErr := HashString("s3cr3t")
	if hashErr != nil {
		t.Fatalf("Unexpected error %v", hashErr)
	}
	if err := CompareString("s3cr3t", hash.Marshal()); err != nil {
		t.Errorf("Unexpected error %v", err)
	}
	if err := CompareString("other", hash.Marshal()); err == nil {
		t.Errorf("Comparison unexpectedly passed for wrong password")
	}
}
