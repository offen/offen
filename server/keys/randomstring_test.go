package keys

import "testing"

func TestGenerateRandomString(t *testing.T) {
	results := []string{}
	for i := 0; i < 16; i++ {
		s, err := GenerateRandomString(32)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if len(s) != 32 {
			t.Errorf("Unexpected result length %d", len(s))
		}
		for _, previous := range results {
			if previous == s {
				t.Errorf("Unexpected duplicate %v", s)
			}
		}
		results = append(results, s)
	}
}
