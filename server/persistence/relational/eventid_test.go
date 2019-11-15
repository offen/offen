package relational

import (
	"strings"
	"testing"
	"time"
)

func TestNewEventID(t *testing.T) {
	first, firstErr := newEventID()
	if firstErr != nil {
		t.Fatalf("Unexpected error %v", firstErr)
	}

	time.Sleep(time.Millisecond)

	second, secondErr := newEventID()
	if secondErr != nil {
		t.Fatalf("Unexpected error %v", secondErr)
	}

	if strings.Compare(first, second) != -1 {
		t.Errorf("Expected first event id to sort lower, got %s and %s", first, second)
	}

	hourAgo, hourAgoErr := EventIDAt(time.Now().Add(-time.Hour))
	if hourAgoErr != nil {
		t.Errorf("Unexpected error %v", hourAgoErr)
	}

	if strings.Compare(hourAgo, first) != -1 {
		t.Errorf("Expected fixed event id to sort lower, got %s and %s", hourAgo, first)
	}

	if strings.Compare(hourAgo, second) != -1 {
		t.Errorf("Expected fixed event id to sort lower, got %s and %s", hourAgo, second)
	}
}