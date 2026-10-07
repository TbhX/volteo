import sys,unittest
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import geo
class GeographyTests(unittest.TestCase):
 def test_distance_and_absent_coordinates(self):
  self.assertEqual(geo.distance(48.85,2.35,48.85,2.35),0)
  self.assertIsNone(geo.normalize_fuel({'id':1},48.85,2.35))
 def test_prices_skip_unavailable_and_mark_old(self):
  row={'id':1,'geom':{'lat':48.85,'lon':2.35},'e10_prix':1.9,'e10_maj':'2020-01-01T00:00:00Z','gazole_prix':1.8,'gazole_maj':datetime.now(timezone.utc).isoformat(),'gazole_rupture_type':'temporaire'}
  r=geo.normalize_fuel(row,48.85,2.35)
  self.assertEqual(list(r['prices']),['E10']);self.assertTrue(r['prices']['E10']['stale'])
 def test_dealer_center_and_unsafe_url(self):
  r=geo.normalize_dealer({'id':2,'type':'way','center':{'lat':48.85,'lon':2.35},'tags':{'name':'Example','website':'javascript:alert(1)'}},48.85,2.35)
  self.assertIsNone(r['website']);self.assertFalse(r['electricConfirmed']);self.assertEqual(r['distance'],0)
