package persistence

func (r *relationalDatabase) CheckHealth() error {
	return r.ping()
}
