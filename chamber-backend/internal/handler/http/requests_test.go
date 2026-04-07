package http

import (
	"testing"
	"time"
)

// TestFeeBillUpdateRequestPreservesZeroValues 验证更新请求不会丢失零值字段。
func TestFeeBillUpdateRequestPreservesZeroValues(t *testing.T) {
	amount := int64(0)
	remark := ""

	req := feeBillUpdateRequest{
		Amount: &amount,
		Remark: &remark,
	}

	updates, err := req.Updates()
	if err != nil {
		t.Fatalf("Updates() returned error: %v", err)
	}

	if got, ok := updates["amount"].(int64); !ok || got != 0 {
		t.Fatalf("amount update = %#v, want 0", updates["amount"])
	}
	if got, ok := updates["remark"].(string); !ok || got != "" {
		t.Fatalf("remark update = %#v, want empty string", updates["remark"])
	}
}

// TestOrganizationUpdateRequestRejectsBlankName 验证组织名称不能为空白字符串。
func TestOrganizationUpdateRequestRejectsBlankName(t *testing.T) {
	name := "   "
	req := organizationUpdateRequest{Name: &name}

	if _, err := req.Updates(); err == nil {
		t.Fatal("Updates() returned nil error for blank name")
	}
}

// TestMemberUpdateRequestAllowsClearingEmail 验证更新时可以把邮箱清空。
func TestMemberUpdateRequestAllowsClearingEmail(t *testing.T) {
	email := ""
	req := memberUpdateRequest{Email: &email}

	updates, err := req.Updates()
	if err != nil {
		t.Fatalf("Updates() returned error: %v", err)
	}

	if got, ok := updates["email"].(string); !ok || got != "" {
		t.Fatalf("email update = %#v, want empty string", updates["email"])
	}
}

// TestActivityCreateRequestRejectsInvalidTimeRange 验证活动结束时间不能早于开始时间。
func TestActivityCreateRequestRejectsInvalidTimeRange(t *testing.T) {
	start := time.Date(2026, time.April, 2, 12, 0, 0, 0, time.UTC)
	end := start.Add(-time.Hour)

	req := activityCreateRequest{
		Title:     "Board Meeting",
		StartTime: start,
		EndTime:   end,
	}

	if _, err := req.ToModel(); err == nil {
		t.Fatal("ToModel() returned nil error for invalid time range")
	}
}

// TestFinalizeUpdatesRejectsEmptyPayload 验证空更新请求会被直接拒绝。
func TestFinalizeUpdatesRejectsEmptyPayload(t *testing.T) {
	if _, err := finalizeUpdates(map[string]any{}); err == nil {
		t.Fatal("finalizeUpdates() returned nil error for empty payload")
	}
}
