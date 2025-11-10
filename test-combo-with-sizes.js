const axios = require('axios');

async function testComboEndpointWithSizes() {
  try {
    // Usar el invitado que sabemos que tiene combo PLUS y merchandise
    const inviteeId = '0b465414-2816-49da-b379-21e6a5f0a983'; // Miguel Ángel López
    
    console.log('🚀 Probando endpoint de combo info con merchandise sizes...\n');
    console.log(`   Invitee ID: ${inviteeId}`);
    console.log(`   Endpoint: GET /invitees/${inviteeId}/combo-info\n`);
    
    const response = await axios.get(`http://localhost:3072/invitees/${inviteeId}/combo-info`, {
      headers: {
        'Authorization': 'Bearer test-token' // Placeholder - en producción necesitarías un token válido
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.hasCombo && response.data.merchandise) {
      console.log('\n📦 Información de merchandise:');
      console.log(`   Enabled: ${response.data.merchandise.enabled}`);
      
      if (response.data.merchandise.allMerchandise) {
        response.data.merchandise.allMerchandise.forEach((item, index) => {
          console.log(`   [${index + 1}] ${item.label} (${item.type})`);
          console.log(`       Tallas disponibles: ${item.sizes.join(', ')}`);
        });
      }
      
      if (response.data.merchandise.selectedSizes) {
        console.log('\n👕 Tallas seleccionadas:');
        Object.entries(response.data.merchandise.selectedSizes).forEach(([type, size]) => {
          console.log(`   ${type}: ${size}`);
        });
      }
      
      if (response.data.attendeeInfo?.merchandiseSizes) {
        console.log('\n👤 AttendeeInfo merchandise sizes:');
        Object.entries(response.data.attendeeInfo.merchandiseSizes).forEach(([type, size]) => {
          console.log(`   ${type}: ${size}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testComboEndpointWithSizes();