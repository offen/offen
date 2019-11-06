package persistence

func (r *relationalDatabase) CheckHealth() error {
	return r.db.Ping()
}
